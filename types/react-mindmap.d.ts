declare module 'react-mindmap' {
  interface MindMapData {
    id: string;
    topic: string;
    children: MindMapData[];
  }

  interface MindMapOptions {
    theme?: string;
    nodeShape?: string;
    nodeColor?: string;
    lineColor?: string;
    lineWidth?: number;
    padding?: number;
  }

  interface MindMapProps {
    data: MindMapData;
    options?: MindMapOptions;
  }

  const MindMap: React.FC<MindMapProps>;
  export default MindMap;
} 