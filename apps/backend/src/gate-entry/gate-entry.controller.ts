import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Res } from '@nestjs/common';
import { Response } from 'express';
import * as ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { GateEntryService } from './gate-entry.service';
import { CreateGateEntryDto, UpdateGateEntryDto } from './dto/gate-entry.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { SortOrder } from '../common/query-optimization.dto';

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
        @Query('sortBy') sortBy?: string,
        @Query('sortOrder') sortOrder?: string,
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
            sortBy,
            sortOrder: sortOrder as SortOrder,
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
        const report = await this.gateEntryService.generateReport({
            riceMillId: user.riceMillId,
            fromDate,
            toDate,
            reportType,
            societyId,
            districtId,
            seasonId,
        });

        const data = report.data;
        const riceMillName = report.riceMillName;

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

            // Add rice mill name
            doc.fontSize(18).font('Helvetica-Bold').text(riceMillName, { align: 'center' });
            doc.moveDown(0.5);

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
            const headerY = doc.y;
            headers.forEach(header => {
                doc.text(header, xPos, headerY, { width: columnWidth, align: 'left', continued: false });
                xPos += columnWidth;
            });
            doc.moveDown();

            // Draw horizontal line
            doc.moveTo(30, doc.y).lineTo(doc.page.width - 30, doc.y).stroke();
            doc.moveDown(0.5);

            // Add data rows
            doc.font('Helvetica').fontSize(8);
            data.forEach((row, index) => {
                // Check if this is the total row (row with 'TOTAL' in any field)
                const isTotalRow = Object.values(row).some(val => val === 'TOTAL');

                // Add extra spacing before total row
                if (isTotalRow) {
                    doc.moveDown(0.5);
                    doc.moveTo(30, doc.y).lineTo(doc.page.width - 30, doc.y).stroke();
                    doc.moveDown(0.3);
                    doc.font('Helvetica-Bold').fontSize(9);
                }

                // Check if we need a new page
                if (doc.y > doc.page.height - 100) {
                    doc.addPage();
                }

                xPos = 30;
                const startY = doc.y;
                let maxHeight = 0;

                // Calculate max height needed for this row
                headers.forEach(header => {
                    const value = row[header] !== null && row[header] !== undefined ? String(row[header]) : '';
                    const textHeight = doc.heightOfString(value, { width: columnWidth });
                    if (textHeight > maxHeight) maxHeight = textHeight;
                });

                // Draw all cells at the same startY
                headers.forEach(header => {
                    const value = row[header] !== null && row[header] !== undefined ? String(row[header]) : '';
                    doc.text(value, xPos, startY, { width: columnWidth, align: 'left' });
                    xPos += columnWidth;
                });

                // Move down by the actual height of the tallest cell
                doc.y = startY + maxHeight;
                doc.moveDown(0.3);

                // Reset font after total row
                if (isTotalRow) {
                    doc.font('Helvetica').fontSize(8);
                }

                // Add subtle line between rows (but not after the last row or total row)
                if (index < data.length - 1 && !isTotalRow) {
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

            // Add rice mill name as title
            worksheet.mergeCells('A1', `${String.fromCharCode(64 + headers.length)}1`);
            worksheet.getCell('A1').value = riceMillName;
            worksheet.getCell('A1').font = { bold: true, size: 16 };
            worksheet.getCell('A1').alignment = { horizontal: 'center' };

            // Add report title
            worksheet.mergeCells('A2', `${String.fromCharCode(64 + headers.length)}2`);
            worksheet.getCell('A2').value = `${reportType.toUpperCase()} REPORT`;
            worksheet.getCell('A2').font = { bold: true, size: 14 };
            worksheet.getCell('A2').alignment = { horizontal: 'center' };

            // Add date range
            worksheet.mergeCells('A3', `${String.fromCharCode(64 + headers.length)}3`);
            worksheet.getCell('A3').value = `Period: ${fromDate} to ${toDate}`;
            worksheet.getCell('A3').alignment = { horizontal: 'center' };

            // Add empty row
            worksheet.addRow([]);

            // Add header row with styling
            worksheet.addRow(headers);
            const headerRow = worksheet.lastRow;
            headerRow.font = { bold: true };
            headerRow.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF4472C4' },
            };
            headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };

            // Add data rows and identify total row
            let totalRowNumber = null;
            data.forEach((row, index) => {
                const rowData = headers.map(header => row[header] !== null && row[header] !== undefined ? row[header] : '');
                worksheet.addRow(rowData);

                // Check if this is a total row
                if (Object.values(row).some(val => val === 'TOTAL')) {
                    totalRowNumber = worksheet.lastRow.number;
                }
            });

            // Make total row bold and add spacing
            if (totalRowNumber) {
                const totalRow = worksheet.getRow(totalRowNumber);
                totalRow.font = { bold: true };
                totalRow.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FFE7E6E6' },
                };
                // Add empty row before total
                worksheet.spliceRows(totalRowNumber, 0, []);
            }

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
                `"${riceMillName}"`,
                `"${reportType.toUpperCase()} REPORT"`,
                `"Period: ${fromDate} to ${toDate}"`,
                '',
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
