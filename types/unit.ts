export interface Leccion {
  dia: number
  fecha: string | null
  titulo: string
  inicio: {
    tema: string
    actividades: string[]
    recursos: string[]
    logros: string[]
  }
  desarrollo: {
    tema: string
    actividades: string[]
    recursos: string[]
    logros: string[]
  }
  cierre: {
    tema: string
    actividades: string[]
    recursos: string[]
    logros: string[]
  }
}

export interface Unidad {
  _id: string
  nombreUnidad: string
  asignatura: string
  detallesUnidad: string
  estandaresObjetivos: string
  numeroLecciones: number
  nivelEducativo: string | null
  email: string
  lecciones: Leccion[]
  activo: boolean
  methodology: string
} 