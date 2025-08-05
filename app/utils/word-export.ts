import { Document, Packer, Paragraph } from 'docx';

export const exportToWord = async (content: string, title: string, filename: string) => {
  // Crear el documento con el contenido simple
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            text: content,
          }),
        ],
      },
    ],
  });

  // Generar el archivo
  const buffer = await Packer.toBuffer(doc);
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.docx`;
  link.click();
  window.URL.revokeObjectURL(url);
}; 