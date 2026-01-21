import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Res } from '@nestjs/common';
import { Response } from 'express';
import * as ExcelJS from 'exceljs';
import * as PDFDocument from 'pdfkit';
import { GateEntryService } from './gate-entry.service';
import { CreateGateEntryDto, UpdateGateEntryDto } from './dto/gate-entry.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('gate-entries')
@UseGuards(JwtAuthGuard)
export class GateEntryController {
    constructor(private readonly gateEntryService: GateEntryService) { }

    @Post()
    async create(@Body() createDto: CreateGateEntryDto, @CurrentUser() user: any) {
        return this.gateEntryService.createGateEntry(createDto, user.riceMillId);
    }

    @Get()
    async findAll(
        @CurrentUser() user: any,
        @Query('societyId') societyId?: string,
        @Query('districtId') districtId?: string,
        @Query('seasonId') seasonId?: string,
        @Query('fromDate') fromDate?: string,
        @Query('toDate') toDate?: string,
        @Query('search') search?: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        return this.gateEntryService.findAll({
            riceMillId: user.riceMillId,
            societyId,
            districtId,
            seasonId,
            fromDate,
            toDate,
            search,
            page: page ? parseInt(page) : undefined,
            limit: limit ? parseInt(limit) : undefined,
        });
    }

    @Get('reports/download')
    async downloadReport(
        @CurrentUser() user: any,
        @Query('fromDate') fromDate: string,
        @Query('toDate') toDate: string,
        @Query('reportType') reportType: string,
        @Query('format') format: string = 'csv',
        @Query('societyId') societyId?: string,
        @Query('districtId') districtId?: string,
        @Query('seasonId') seasonId?: string,
        @Res() res?: Response,
    ) {
        const data = await this.gateEntryService.generateReport({
            riceMillId: user.riceMillId,
            fromDate,
            toDate,
            reportType,
            societyId,
            districtId,
            seasonId,
        });

        if (data.length === 0) {
            res.status(404).send('No data found for the selected filters');
            return;
        }

        const headers = Object.keys(data[0]);

        if (format === 'pdf') {
            // Generate PDF file
            const doc = new PDFDocument({ margin: 30, size: 'A4', layout: 'landscape' });

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="${reportType}_report.pdf"`);

            doc.pipe(res);

            // Add title
            doc.fontSize(16).font('Helvetica-Bold').text(`${reportType.toUpperCase()} REPORT`, { align: 'center' });
            doc.moveDown();

            // Add date range
            doc.fontSize(10).font('Helvetica').text(`Period: ${fromDate} to ${toDate}`, { align: 'center' });
            doc.moveDown(2);

            // Calculate column widths
            const pageWidth = doc.page.width - 60; // margins
            const columnWidth = pageWidth / headers.length;

            // Draw table header
            doc.fontSize(9).font('Helvetica-Bold');
            let xPos = 30;
            headers.forEach(header => {
                doc.text(header, xPos, doc.y, { width: columnWidth, align: 'left' });
                xPos += columnWidth;
            });
            doc.moveDown();

            // Draw horizontal line
            doc.moveTo(30, doc.y).lineTo(doc.page.width - 30, doc.y).stroke();
            doc.moveDown(0.5);

            // Add data rows
            doc.font('Helvetica').fontSize(8);
            data.forEach((row, index) => {
                xPos = 30;
                const startY = doc.y;

                // Check if we need a new page
                if (doc.y > doc.page.height - 100) {
                    doc.addPage();
                }

                headers.forEach(header => {
                    const value = row[header] ? String(row[header]) : '';
                    doc.text(value, xPos, startY, { width: columnWidth, align: 'left', height: 20 });
                    xPos += columnWidth;
                });

                doc.moveDown(0.3);

                // Add subtle line between rows
                if (index < data.length - 1) {
                    doc.moveTo(30, doc.y).lineTo(doc.page.width - 30, doc.y).stroke('#CCCCCC');
                    doc.moveDown(0.3);
                }
            });

            // Add footer
            doc.fontSize(8).text(`Generated on: ${new Date().toLocaleString()}`, 30, doc.page.height - 50);
            doc.text(`Total Records: ${data.length}`, { align: 'right' });

            doc.end();
        } else if (format === 'excel' || format === 'xlsx') {
            // Generate Excel file
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Report');

            // Add header row with styling
            worksheet.addRow(headers);
            worksheet.getRow(1).font = { bold: true };
            worksheet.getRow(1).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF4472C4' },
            };
            worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

            // Add data rows
            data.forEach(row => {
                worksheet.addRow(headers.map(header => row[header] || ''));
            });

            // Auto-fit columns
            worksheet.columns.forEach(column => {
                let maxLength = 0;
                column.eachCell({ includeEmpty: true }, cell => {
                    const cellLength = cell.value ? cell.value.toString().length : 10;
                    if (cellLength > maxLength) {
                        maxLength = cellLength;
                    }
                });
                column.width = maxLength < 10 ? 10 : maxLength + 2;
            });

            // Generate buffer and send
            const buffer = await workbook.xlsx.writeBuffer();
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename="${reportType}_report.xlsx"`);
            res.send(buffer);
        } else {
            // Generate CSV file
            const csvRows = [
                headers.join(','),
                ...data.map(row => headers.map(header => `"${row[header] || ''}"`).join(',')),
            ];

            const csv = csvRows.join('\n');

            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="${reportType}_report.csv"`);
            res.send(csv);
        }
    }

    @Get(':id')
    async findOne(@Param('id') id: string, @CurrentUser() user: any) {
        return this.gateEntryService.findOne(id, user.riceMillId);
    }

    @Put(':id')
    async update(@Param('id') id: string, @Body() updateDto: UpdateGateEntryDto, @CurrentUser() user: any) {
        return this.gateEntryService.update(id, updateDto, user.riceMillId);
    }

    @Delete(':id')
    async remove(@Param('id') id: string, @CurrentUser() user: any) {
        return this.gateEntryService.remove(id, user.riceMillId);
    }
}
