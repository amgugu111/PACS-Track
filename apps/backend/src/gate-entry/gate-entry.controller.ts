import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Res } from '@nestjs/common';
import { Response } from 'express';
import * as ExcelJS from 'exceljs';
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

        if (format === 'excel' || format === 'xlsx') {
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
