import * as ExcelJS from 'exceljs'

export async function duplicateSheet(
    workbook: ExcelJS.Workbook,
    source: ExcelJS.Worksheet,
    name: string,
){
    const newSheet = workbook.addWorksheet(name)

    source.eachRow({ includeEmpty:true }, (row,rowNumber)=>{

        const newRow = newSheet.getRow(rowNumber)

        row.eachCell({ includeEmpty:true }, (cell,col)=>{

            const c = newRow.getCell(col)

            c.value = cell.value

            c.style = JSON.parse(JSON.stringify(cell.style))

            if(cell.numFmt)
                c.numFmt = cell.numFmt

            if(cell.alignment)
                c.alignment = { ...cell.alignment }

            if(cell.border)
                c.border = JSON.parse(JSON.stringify(cell.border))

            if(cell.fill)
                c.fill = JSON.parse(JSON.stringify(cell.fill))

            if(cell.font)
                c.font = JSON.parse(JSON.stringify(cell.font))
        })

        newRow.height = row.height
    })

    source.columns.forEach((column,index)=>{
        newSheet.getColumn(index+1).width = column.width
    })

    return newSheet
}