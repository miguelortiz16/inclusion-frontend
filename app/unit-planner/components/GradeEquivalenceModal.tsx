import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";

interface GradeEquivalenceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const tableData = [
  ["Grado estándar ProfePlanner", "Colombia", "México", "Perú", "Chile", "Ecuador", "Argentina", "Costa Rica", "Guatemala", "El Salvador", "Paraguay", "Estados Unidos", "España", "Cuba", "Venezuela", "República Dominicana", "Panamá", "Nicaragua", "Bolivia", "Honduras", "Puerto Rico", "Uruguay", "Francia", "Canadá", "Reino Unido"],
  ["Grado 1", "1° Primaria", "1° Primaria", "1° Primaria", "1° Básico", "2° EGB", "1° Primaria", "1° EGB", "1° Primaria", "1° Grado", "1° Grado", "1st Grade", "1° Primaria", "1° Grado", "1° Grado", "1° Grado", "1° Grado", "1° Grado", "1° Primaria", "1° Grado", "1° Grado", "1° Primaria CP", "Grade 1", "Year 2", "Year 2"],
  ["Grado 2", "2° Primaria", "2° Primaria", "2° Primaria", "2° Básico", "3° EGB", "2° Primaria", "2° EGB", "2° Primaria", "2° Grado", "2° Grado", "2nd Grade", "2° Primaria", "2° Grado", "2° Grado", "2° Grado", "2° Grado", "2° Grado", "2° Primaria", "2° Grado", "2° Grado", "2° Primaria CE1", "Grade 2", "Year 3", "Year 3"],
  ["Grado 3", "3° Primaria", "3° Primaria", "3° Primaria", "3° Básico", "4° EGB", "3° Primaria", "3° EGB", "3° Primaria", "3° Grado", "3° Grado", "3rd Grade", "3° Primaria", "3° Grado", "3° Grado", "3° Grado", "3° Grado", "3° Grado", "3° Primaria", "3° Grado", "3° Grado", "3° Primaria CE2", "Grade 3", "Year 4", "Year 4"],
  ["Grado 4", "4° Primaria", "4° Primaria", "4° Primaria", "4° Básico", "5° EGB", "4° Primaria", "4° EGB", "4° Primaria", "4° Grado", "4° Grado", "4th Grade", "4° Primaria", "4° Grado", "4° Grado", "4° Grado", "4° Grado", "4° Grado", "4° Primaria", "4° Grado", "4° Grado", "4° Primaria CM1", "Grade 4", "Year 5", "Year 5"],
  ["Grado 5", "5° Primaria", "5° Primaria", "5° Primaria", "5° Básico", "6° EGB", "5° Primaria", "5° EGB", "5° Primaria", "5° Grado", "5° Grado", "5th Grade", "5° Primaria", "5° Grado", "5° Grado", "5° Grado", "5° Grado", "5° Grado", "5° Primaria", "5° Grado", "5° Grado", "5° Primaria CM2", "Grade 5", "Year 6", "Year 6"],
  ["Grado 6", "6° Primaria", "6° Primaria", "6° Primaria", "6° Básico", "1° Secundaria", "6° Primaria", "6° EGB", "6° Primaria", "6° Grado", "6° Grado", "6th Grade", "6° Primaria", "6° Grado", "6° Grado", "6° Grado", "6° Grado", "6° Grado", "6° Primaria", "6° Grado", "6° Grado", "6° Primaria 6e", "Grade 6", "Year 7", "Year 7"],
  ["Grado 7", "7° Básica", "1° Secundaria", "1° Secundaria", "7° Básico", "2° Secundaria", "1° Secundaria", "7° EGB", "1° Básico", "7° Grado", "7° Grado", "7th Grade", "1° ESO", "7° Grado", "1° Año", "1° Año", "1° Año", "1° Año", "1° Secundaria", "7° Grado", "7° Grado", "1° Ciclo B4", "Grade 7", "Year 8", "Year 8"],
  ["Grado 8", "8° Básica", "2° Secundaria", "2° Secundaria", "8° Básico", "3° Secundaria", "2° Secundaria", "8° EGB", "2° Básico", "8° Grado", "8° Grado", "8th Grade", "2° ESO", "8° Grado", "2° Año", "2° Año", "2° Año", "2° Año", "2° Secundaria", "8° Grado", "8° Grado", "2° Ciclo B4", "Grade 8", "Year 9", "Year 9"],
  ["Grado 9", "9° Básica Sec", "1° Preparatoria", "3° Secundaria", "2° Medio", "4° Secundaria", "3° Secundaria", "9° EGB", "3° Básico", "9° Grado", "9° Grado", "9th Grade", "3° ESO", "9° Grado", "3° Año", "3° Año", "3° Año", "3° Año", "3° Secundaria", "9° Grado", "9° Grado", "3° Ciclo B4", "Grade 9", "Year 10", "Year 10"],
  ["Grado 10", "10° Media", "2° Preparatoria", "4° Secundaria", "3° Medio", "1° Bachiller", "4° Secundaria", "10° EGB", "4° Diversificado", "10° Grado", "10° Grado", "10th Grade", "4° ESO", "10° Grado", "4° Año", "4° Año", "4° Año", "4° Año", "4° Secundaria", "10° Grado", "10° Grado", "4° Educaci 2nde", "Grade 10", "Year 11", "Year 11"],
  ["Grado 11", "11° Media", "3° Preparatoria", "5° Secundaria", "4° Medio", "2° Bachiller", "5° Secundaria", "11° EGB", "5° Diversificado", "11° Grado", "11° Grado", "11th Grade", "1° Bachiller", "11° Grado", "5° Año", "5° Año", "5° Año", "5° Año", "5° Secundaria", "11° Grado", "11° Grado", "5° Educaci 1ère", "Grade 11", "Year 12", "Year 12"],
];

export default function GradeEquivalenceModal({ open, onOpenChange }: GradeEquivalenceModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Equivalencia de grados por país</DialogTitle>
          <DialogDescription>
            Consulta cómo se comparan los grados escolares en diferentes países.
          </DialogDescription>
        </DialogHeader>
        <div className="overflow-x-auto mt-4 border rounded relative" style={{ paddingBottom: 8 }}>
          <table className="min-w-max text-xs md:text-sm border border-gray-300 mr-4">
            <thead className="bg-gray-100 sticky top-0 z-10">
              <tr>
                {tableData[0].map((header, idx) => (
                  <th key={idx} className="px-2 py-1 border border-gray-200 whitespace-nowrap font-semibold text-gray-700">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableData.slice(1).map((row, i) => (
                <tr key={i} className="even:bg-gray-50">
                  {row.map((cell, j) => (
                    <td key={j} className="px-2 py-1 border border-gray-200 whitespace-nowrap">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="pointer-events-none absolute top-0 right-0 h-full w-8 bg-gradient-to-l from-white to-transparent" />
        </div>
        <p className="text-xs text-gray-500 mt-2 text-center">Desliza horizontalmente para ver todos los países &rarr;</p>
        <DialogClose asChild>
          <button className="mt-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 mx-auto block">Cerrar</button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
} 