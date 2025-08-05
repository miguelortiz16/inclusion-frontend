import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, BorderStyle, WidthType, AlignmentType, convertInchesToTwip } from 'docx';

export const exportToWord = async (content: any, title: string, fileName: string) => {
  if (!content) {
    throw new Error('No hay contenido para exportar');
  }

  try {
    const children = [];
    
    // Título principal
    children.push(
      new Paragraph({
        text: title,
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
        spacing: {
          after: 400,
          before: 400,
        },
      })
    );

    // Si el contenido es un objeto con estructura específica (como el DUA o PIAR)
    if (typeof content === 'object') {
      // Información del estudiante (para PIAR)
      if (content.studentInfo) {
        children.push(
          new Paragraph({
            text: 'Información del Estudiante',
            heading: HeadingLevel.HEADING_2,
            spacing: { after: 200, before: 200 },
          })
        );

        const studentInfoTable = new Table({
          width: {
            size: 100,
            type: WidthType.PERCENTAGE,
          },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 1, color: "cccccc" },
            bottom: { style: BorderStyle.SINGLE, size: 1, color: "cccccc" },
            left: { style: BorderStyle.SINGLE, size: 1, color: "cccccc" },
            right: { style: BorderStyle.SINGLE, size: 1, color: "cccccc" },
          },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  width: {
                    size: 30,
                    type: WidthType.PERCENTAGE,
                  },
                  children: [new Paragraph({
                    children: [new TextRun({
                      text: "Nombre",
                      bold: true,
                    })],
                  })],
                }),
                new TableCell({
                  width: {
                    size: 70,
                    type: WidthType.PERCENTAGE,
                  },
                  children: [new Paragraph(content.studentInfo.name)],
                }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({
                  children: [new Paragraph({
                    children: [new TextRun({
                      text: "Grado",
                      bold: true,
                    })],
                  })],
                }),
                new TableCell({
                  children: [new Paragraph(content.studentInfo.grade)],
                }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({
                  children: [new Paragraph({
                    children: [new TextRun({
                      text: "Asignaturas",
                      bold: true,
                    })],
                  })],
                }),
                new TableCell({
                  children: [new Paragraph(content.studentInfo.subjects)],
                }),
              ],
            }),
          ],
        });
        children.push(studentInfoTable);

        // Tabla principal (para PIAR)
        if (content.mainTable) {
          children.push(
            new Paragraph({
              text: 'Tabla Principal',
              heading: HeadingLevel.HEADING_2,
              spacing: { after: 200, before: 400 },
            })
          );

          const mainTable = new Table({
            width: {
              size: 100,
              type: WidthType.PERCENTAGE,
            },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 1, color: "cccccc" },
              bottom: { style: BorderStyle.SINGLE, size: 1, color: "cccccc" },
              left: { style: BorderStyle.SINGLE, size: 1, color: "cccccc" },
              right: { style: BorderStyle.SINGLE, size: 1, color: "cccccc" },
            },
            rows: [
              new TableRow({
                children: content.mainTable.headers.map((header: string) => 
                  new TableCell({
                    children: [new Paragraph({
                      children: [new TextRun({
                        text: header,
                        bold: true,
                      })],
                    })],
                  })
                ),
              }),
              ...content.mainTable.rows.map((row: string[]) => 
                new TableRow({
                  children: row.map((cell: string) => 
                    new TableCell({
                      children: [new Paragraph(cell)],
                    })
                  ),
                })
              ),
            ],
          });
          children.push(mainTable);
        }

        // Secciones (para PIAR)
        if (content.sections) {
          content.sections.forEach((section: any) => {
            children.push(
              new Paragraph({
                text: section.title,
                heading: HeadingLevel.HEADING_2,
                spacing: { after: 200, before: 400 },
              })
            );

            if (Array.isArray(section.content)) {
              section.content.forEach((item: string) => {
                children.push(
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: "• " + item,
                      }),
                    ],
                    spacing: { after: 100 },
                  })
                );
              });
            } else {
              children.push(
                new Paragraph({
                  text: section.content,
                  spacing: { after: 200 },
                })
              );
            }
          });
        }

        // Informe (para PIAR)
        if (content.informe) {
          children.push(
            new Paragraph({
              text: 'Informe PIAR',
              heading: HeadingLevel.HEADING_2,
              spacing: { after: 200, before: 400 },
            })
          );

          // Detalles del informe
          const informeTable = new Table({
            width: {
              size: 100,
              type: WidthType.PERCENTAGE,
            },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 1, color: "cccccc" },
              bottom: { style: BorderStyle.SINGLE, size: 1, color: "cccccc" },
              left: { style: BorderStyle.SINGLE, size: 1, color: "cccccc" },
              right: { style: BorderStyle.SINGLE, size: 1, color: "cccccc" },
            },
            rows: Object.entries(content.informe.details).map(([key, value]) => 
              new TableRow({
                children: [
                  new TableCell({
                    width: {
                      size: 30,
                      type: WidthType.PERCENTAGE,
                    },
                    children: [new Paragraph({
                      children: [new TextRun({
                        text: key,
                        bold: true,
                      })],
                    })],
                  }),
                  new TableCell({
                    width: {
                      size: 70,
                      type: WidthType.PERCENTAGE,
                    },
                    children: [new Paragraph(String(value))],
                  }),
                ],
              })
            ),
          });
          children.push(informeTable);

          // Acciones realizadas
          if (content.informe.acciones && content.informe.acciones.length > 0) {
            children.push(
              new Paragraph({
                text: 'Acciones Realizadas',
                heading: HeadingLevel.HEADING_3,
                spacing: { after: 200, before: 200 },
              })
            );
            content.informe.acciones.forEach((accion: string) => {
              children.push(
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "• " + accion,
                    }),
                  ],
                  spacing: { after: 100 },
                })
              );
            });
          }

          // Responsables
          if (content.informe.responsables && content.informe.responsables.length > 0) {
            children.push(
              new Paragraph({
                text: 'Responsables',
                heading: HeadingLevel.HEADING_3,
                spacing: { after: 200, before: 200 },
              })
            );
            content.informe.responsables.forEach((responsable: string) => {
              children.push(
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "• " + responsable,
                    }),
                  ],
                  spacing: { after: 100 },
                })
              );
            });
          }
        }
      }
      // Si es un DUA
      else if (content.generalInfo) {
        // Información general
        children.push(
          new Paragraph({
            text: 'Información General',
            heading: HeadingLevel.HEADING_2,
            spacing: { after: 200, before: 200 },
          })
        );

        // Tabla de información general
        const infoTable = new Table({
          width: {
            size: 100,
            type: WidthType.PERCENTAGE,
          },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 1, color: "cccccc" },
            bottom: { style: BorderStyle.SINGLE, size: 1, color: "cccccc" },
            left: { style: BorderStyle.SINGLE, size: 1, color: "cccccc" },
            right: { style: BorderStyle.SINGLE, size: 1, color: "cccccc" },
          },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  width: {
                    size: 30,
                    type: WidthType.PERCENTAGE,
                  },
                  children: [new Paragraph({
                    children: [new TextRun({
                      text: "Asignatura",
                      bold: true,
                    })],
                  })],
                }),
                new TableCell({
                  width: {
                    size: 70,
                    type: WidthType.PERCENTAGE,
                  },
                  children: [new Paragraph(content.generalInfo.asignatura)],
                }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({
                  children: [new Paragraph({
                    children: [new TextRun({
                      text: "Grado",
                      bold: true,
                    })],
                  })],
                }),
                new TableCell({
                  children: [new Paragraph(content.generalInfo.grado)],
                }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({
                  children: [new Paragraph({
                    children: [new TextRun({
                      text: "Duración Total",
                      bold: true,
                    })],
                  })],
                }),
                new TableCell({
                  children: [new Paragraph(content.generalInfo.duracion_total)],
                }),
              ],
            }),
          ],
        });
        children.push(infoTable);

        // Objetivo General
        children.push(
          new Paragraph({
            text: 'Objetivo General',
            heading: HeadingLevel.HEADING_2,
            spacing: { after: 200, before: 400 },
          }),
          new Paragraph({
            text: content.generalInfo.objetivo_general,
            spacing: { after: 400 },
          })
        );

        // Temas
        if (content.temas && content.temas.length > 0) {
          content.temas.forEach((tema: any, index: number) => {
            children.push(
              new Paragraph({
                text: `Tema ${index + 1}: ${tema.nombre}`,
                heading: HeadingLevel.HEADING_2,
                spacing: { after: 200, before: 400 },
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Duración: ",
                    bold: true,
                  }),
                  new TextRun(tema.duracion),
                ],
                spacing: { after: 200 },
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Objetivo Específico: ",
                    bold: true,
                  }),
                  new TextRun(tema.objetivo),
                ],
                spacing: { after: 200 },
              })
            );

            // Principios DUA
            if (tema.principios) {
              children.push(
                new Paragraph({
                  text: "Principios DUA",
                  heading: HeadingLevel.HEADING_3,
                  spacing: { after: 200, before: 200 },
                })
              );

              // Representación
              children.push(
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "Representación",
                      bold: true,
                    }),
                  ],
                  spacing: { after: 100 },
                })
              );
              tema.principios.representacion.forEach((item: string) => {
                children.push(
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: "• " + item,
                      }),
                    ],
                    spacing: { after: 100 },
                  })
                );
              });

              // Acción y Expresión
              children.push(
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "Acción y Expresión",
                      bold: true,
                    }),
                  ],
                  spacing: { after: 100, before: 200 },
                })
              );
              tema.principios.accion_y_expresion.forEach((item: string) => {
                children.push(
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: "• " + item,
                      }),
                    ],
                    spacing: { after: 100 },
                  })
                );
              });

              // Motivación y Compromiso
              children.push(
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "Motivación y Compromiso",
                      bold: true,
                    }),
                  ],
                  spacing: { after: 100, before: 200 },
                })
              );
              tema.principios.motivacion_y_compromiso.forEach((item: string) => {
                children.push(
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: "• " + item,
                      }),
                    ],
                    spacing: { after: 100 },
                  })
                );
              });
            }

            // Evaluación
            if (tema.evaluacion) {
              children.push(
                new Paragraph({
                  text: "Evaluación",
                  heading: HeadingLevel.HEADING_3,
                  spacing: { after: 200, before: 200 },
                }),
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "Instrumento: ",
                      bold: true,
                    }),
                    new TextRun(tema.evaluacion.instrumento),
                  ],
                  spacing: { after: 200 },
                })
              );

              if (tema.evaluacion.criterios && tema.evaluacion.criterios.length > 0) {
                children.push(
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: "Criterios:",
                        bold: true,
                      }),
                    ],
                    spacing: { after: 100 },
                  })
                );
                tema.evaluacion.criterios.forEach((criterio: string) => {
                  children.push(
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: "• " + criterio,
                        }),
                      ],
                      spacing: { after: 100 },
                    })
                  );
                });
              }
            }
          });
        }

        // Adecuaciones y Apoyos
        if (content.adecuaciones && content.adecuaciones.length > 0) {
          children.push(
            new Paragraph({
              text: "Adecuaciones y Apoyos",
              heading: HeadingLevel.HEADING_2,
              spacing: { after: 200, before: 400 },
            })
          );
          content.adecuaciones.forEach((item: string) => {
            children.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: "• " + item,
                  }),
                ],
                spacing: { after: 100 },
              })
            );
          });
        }
      }
    } else {
      // Si el contenido es texto plano
      const textContent = typeof content === 'string' ? content : JSON.stringify(content, null, 2);
      children.push(
        new Paragraph({
          text: textContent,
          spacing: { after: 200 },
        })
      );
    }

    // Crear el documento
    const doc = new Document({
      sections: [{
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(1),
              right: convertInchesToTwip(1),
              bottom: convertInchesToTwip(1),
              left: convertInchesToTwip(1),
            },
          },
        },
        children: children,
      }],
    });

    // Generar y descargar el documento
    const blob = await Packer.toBlob(doc);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName}.docx`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
    return true;
  } catch (error) {
    console.error('Error al exportar a Word:', error);
    throw error;
  }
}; 