import * as XLSX from 'xlsx'

export const exportToExcel = (rubric: string) => {
  try {
    const rubricData = JSON.parse(rubric)
    const workbook = XLSX.utils.book_new()

    // Prepare main data
    const mainData = [
      [rubricData.titulo],
      [rubricData.descripcion],
      [], // Empty row for spacing
      ['Criterio', 'Descripción', 'Escala de Calificación', 'Calificación']
    ]

    // Add criteria rows
    rubricData.criterios.forEach((criterio: any) => {
      const escalaText = criterio.escala.map((nivel: any) => 
        `Puntaje ${nivel.puntaje}: ${nivel.descripcion}`
      ).join('\n')

      mainData.push([
        criterio.nombre,
        criterio.descripcion,
        escalaText,
        '______'
      ])
    })

    // Add final grade section
    mainData.push(
      [],
      ['Calificación Final'],
      [`Total de puntos obtenidos: ______ / ${rubricData.criterios.length * 5}`],
      ['Nota Final: ______']
    )

    // Create worksheet
    const worksheet = XLSX.utils.aoa_to_sheet(mainData)

    // Set column widths
    worksheet['!cols'] = [
      { wch: 30 }, // Criterio
      { wch: 40 }, // Descripción
      { wch: 50 }, // Escala de Calificación
      { wch: 20 }  // Calificación
    ]

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Rúbrica')

    // Save file
    const filename = `${rubricData.titulo.toLowerCase().replace(/\s+/g, '-')}-rubrica.xlsx`
    XLSX.writeFile(workbook, filename)

    return true
  } catch (error) {
    console.error('Error exporting to Excel:', error)
    return false
  }
} 