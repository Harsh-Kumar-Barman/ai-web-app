// import React from 'react';
// import { FileItem } from '../app/types';
// import { Editor } from '@monaco-editor/react';

// interface CodeEditorProps {
//   file: FileItem | null;
// }

// export function CodeEditor({ file }: CodeEditorProps) {
//   console.log(file)
//   if (!file) {
//     return (
//       <div className="h-full flex items-center justify-center text-gray-400">
//         Select a file to view its contents
//       </div>
//     );
//   }

//   return (
//     <Editor
//       height="100%"
//       defaultLanguage="typescript"
//       theme="vs-dark"
//       value={file.content || ''}
//       options={{
//         minimap: { enabled: false },
//         fontSize: 14,
//         wordWrap: 'on',
//         scrollBeyondLastLine: false,
//       }}
//     />
//   );
// }
// import React, { useState, useRef, useEffect } from 'react';
// import Editor, { OnMount } from '@monaco-editor/react';
// import { FileItem } from '../app/types';

// interface CodeEditorProps {
//   file: FileItem | null;
// }

// export function CodeEditor({ file }: CodeEditorProps) {
//   const [content, setContent] = useState<string>(file?.content || '');
//   const [prevContent, setPrevContent] = useState<string>(file?.content || '');
//   const editorRef = useRef<any>(null);
//   console.log(file)

//   // Update content state when a new file is selected
//   useEffect(() => {
//     const newContent = file?.content || '';
//     setContent(newContent);
//     setPrevContent(newContent);
//   }, [file]);

//   // Capture the Monaco editor instance
//   const handleEditorDidMount: OnMount = (editor, monaco) => {
//     editorRef.current = editor;
//   };

//   // Track changes and stash previous value
//   const handleChange = (value: string | undefined) => {
//     console.log(value)
//     if (value === undefined) return;
//     setPrevContent(content);
//     setContent(value);
//   };

//   // Revert to the previous content
//   const handleRevert = () => {
//     if (!editorRef.current) return;
//     editorRef.current.setValue(prevContent);
//     setContent(prevContent);
//   };

//   if (!file) {
//     return (
//       <div className="h-full flex items-center justify-center text-gray-400">
//         Select a file to view its contents
//       </div>
//     );
//   }

//   return (
//     <div className="h-full flex flex-col">
//       <div className="px-4 py-2 bg-gray-800 flex space-x-2">
//         <button
//           onClick={handleRevert}
//           className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-500 transition"
//         >
//           Revert
//         </button>
//       </div>

//       <Editor
//         height="100%"
//         defaultLanguage="typescript"
//         theme="vs-dark"
//         value={content}
//         onMount={handleEditorDidMount}
//         onChange={handleChange}
//         options={{
//           minimap: { enabled: false },
//           fontSize: 14,
//           wordWrap: 'on',
//           scrollBeyondLastLine: false,
//         }}
//       />
//     </div>
//   );
// }

import React, { useEffect, useState, useRef } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import { FileItem } from '../app/types';

interface CodeEditorProps {
  file: FileItem | null;
  /**
   * Called when the editor content changes, so parent can update its files state
   */
  onFileChange?: (updated: FileItem) => void;
}

export function CodeEditor({ file, onFileChange }: CodeEditorProps) {
  const [content, setContent] = useState<string>(file?.content || '');
  const editorRef = useRef<any>(null);

  // Sync state when a new file is selected
  useEffect(() => {
    setContent(file?.content || '');
  }, [file]);

  // Capture the Monaco editor instance
  const handleEditorDidMount: OnMount = (editor) => {
    editorRef.current = editor;
  };

  // Track changes, update local state, and notify parent
  const handleChange = (value: string | undefined) => {
    if (value === undefined) return;
    setContent(value);
    if (file && onFileChange) {
      onFileChange({ ...file, content: value });
    }
  };

  if (!file) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400">
        Select a file to view its contents
      </div>
    );
  }

  return (
    <Editor
      height="100%"
      defaultLanguage={file.name.endsWith('.ts') || file.name.endsWith('.tsx') ? 'typescript' : 'plaintext'}
      theme="vs-dark"
      value={content}
      onMount={handleEditorDidMount}
      onChange={handleChange}
      options={{
        minimap: { enabled: false },
        fontSize: 14,
        wordWrap: 'on',
        scrollBeyondLastLine: false,
      }}
    />
  );
}
