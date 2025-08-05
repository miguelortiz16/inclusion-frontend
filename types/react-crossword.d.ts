declare module 'react-crossword' {
  interface CrosswordProps {
    data: {
      across: {
        [key: string]: {
          clue: string;
          answer: string;
          row: number;
          col: number;
        }
      };
      down: {
        [key: string]: {
          clue: string;
          answer: string;
          row: number;
          col: number;
        }
      };
    };
    theme?: {
      gridBackground?: string;
      cellBackground?: string;
      cellBorder?: string;
      textColor?: string;
      numberColor?: string;
      highlightBackground?: string;
      highlightColor?: string;
    };
  }

  const Crossword: React.FC<CrosswordProps>;
  export default Crossword;
} 