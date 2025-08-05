'use client';

import React, { useState } from 'react';
import axios from 'axios';
import { RiSearchFill, RiArrowLeftSLine, RiArrowRightSLine, RiDownloadLine, RiBookOpenLine } from 'react-icons/ri';
import { useLanguage } from '../../contexts/language-context';
import { motion } from 'framer-motion';

interface ImageResult {
  kind: string;
  title: string;
  htmlTitle: string;
  link: string;
  displayLink: string;
  snippet: string;
  htmlSnippet: string;
  mime: string;
  fileFormat: string;
  image: {
    contextLink: string;
    height: number;
    width: number;
    byteSize: number;
    thumbnailLink: string;
    thumbnailHeight: number;
    thumbnailWidth: number;
  };
}

interface SearchResponse {
  items: ImageResult[];
  queries: {
    request: Array<{
      startIndex: number;
      count: number;
    }>;
    nextPage?: Array<{
      startIndex: number;
      count: number;
    }>;
  };
  searchInformation: {
    totalResults: string;
    formattedTotalResults: string;
  };
}

const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
const CX_ID = process.env.NEXT_PUBLIC_GOOGLE_CX_ID;

export default function ImageSearchPage() {
  const { t } = useLanguage();
  const [query, setQuery] = useState('');
  const [images, setImages] = useState<ImageResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [downloadingImages, setDownloadingImages] = useState<{ [key: string]: boolean }>({});

  const isValidImageUrl = (url: string): boolean => {
    try {
      const urlObj = new URL(url);
      // Verificar si la URL es de un dominio permitido
      const allowedDomains = [
        'googleusercontent.com',
        'wikimedia.org',
        'wikipedia.org',
        'fbsbx.com',
        'squarespace-cdn.com',
        'website-files.com'
      ];
      return allowedDomains.some(domain => urlObj.hostname.endsWith(domain));
    } catch {
      return false;
    }
  };

  const searchImages = async () => {
    if (!query.trim()) return;
    
    setLoading(true);
    setError('');
    try {
      const searchQuery = `${query} material educativo`;
      
      const response = await axios.get<SearchResponse>('https://www.googleapis.com/customsearch/v1', {
        params: {
          key: GOOGLE_API_KEY,
          cx: CX_ID,
          q: searchQuery,
          searchType: 'image',
          num: 10 // Limitamos a 10 resultados
        },
      });

      if (!response.data.items || response.data.items.length === 0) {
        setError('No se encontraron materiales educativos. Intenta con otros términos de búsqueda.');
        setImages([]);
      } else {
        setImages(response.data.items);
      }
    } catch (error: any) {
      console.error('Error al buscar materiales:', error);
      if (error.response?.status === 403) {
        setError('Error de autenticación. Por favor, verifica la configuración de la API.');
      } else if (error.response?.status === 429) {
        setError('Límite de búsquedas alcanzado. Por favor, intenta más mañana por favor.');
      } else {
        setError('Error al buscar materiales. Por favor, intenta de nuevo.');
      }
      setImages([]);
    }
    setLoading(false);
  };

  const handleDownload = async (imageUrl: string, title: string) => {
    if (!isValidImageUrl(imageUrl)) {
      setError('Esta imagen no se puede descargar directamente. Por favor, visita el sitio web original.');
      return;
    }

    setDownloadingImages(prev => ({ ...prev, [imageUrl]: true }));
    try {
      const response = await axios.get(imageUrl, { 
        responseType: 'blob',
        headers: {
          'Accept': 'image/*'
        }
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      const cleanTitle = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      link.setAttribute('download', `${cleanTitle}.jpg`);
      
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error al descargar la imagen:', error);
      setError('Error al descargar la imagen. Por favor, intenta de nuevo o visita el sitio web original.');
    } finally {
      setDownloadingImages(prev => ({ ...prev, [imageUrl]: false }));
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto px-4 py-8"
    >
      <div className="max-w-4xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="flex items-center gap-4 mb-8"
        >
          <RiBookOpenLine className="w-12 h-12 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Buscador de Material Educativo</h1>
            <p className="text-gray-600 mt-1">Encuentra recursos didácticos e imágenes para tus clases</p>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8 bg-white rounded-lg shadow-md p-6"
        >
          <div className="flex flex-col gap-4">
            <div className="flex gap-4">
              <input
                type="text"
                placeholder="Buscar material educativo (ej: matemáticas, ciencias, actividades)"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyPress={(e) => e.key === 'Enter' && searchImages()}
              />
              <button
                onClick={searchImages}
                disabled={loading}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Buscando...' : 'Buscar'}
              </button>
            </div>
            <div className="text-sm text-gray-600">
              Sugerencias: matemáticas, ciencias, actividades, recursos didácticos, material escolar
            </div>
          </div>
        </motion.div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4"
          >
            {error}
          </motion.div>
        )}

        {loading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-8"
          >
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Buscando materiales educativos...</p>
          </motion.div>
        )}

        {!loading && images.length > 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-4 text-sm text-gray-600"
          >
            Mostrando {images.length} resultados
          </motion.div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {images.map((img, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.1 }}
              className="group relative bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="relative">
                <a
                  href={img.image.contextLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <img
                    src={img.link}
                    alt={img.title}
                    className="w-full h-48 object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity"></div>
                </a>
                {isValidImageUrl(img.link) && (
                  <button
                    onClick={() => handleDownload(img.link, img.title)}
                    disabled={downloadingImages[img.link]}
                    className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:bg-blue-50 transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50"
                    title="Descargar material"
                  >
                    <RiDownloadLine className="w-5 h-5 text-blue-600" />
                  </button>
                )}
              </div>
              <div className="p-4">
                <div className="text-sm text-gray-800 font-medium truncate" title={img.title}>
                  {img.title}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {img.image.width}x{img.image.height} • {(img.image.byteSize / 1024).toFixed(1)}KB
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {!loading && images.length === 0 && query && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-8 text-gray-500"
          >
            No se encontraron materiales educativos. Intenta con otros términos de búsqueda.
          </motion.div>
        )}
      </div>
    </motion.div>
  );
} 