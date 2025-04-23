'use client'

import React, { useEffect, useState } from 'react';
import { FileExplorer } from '../../components/FileExplorer';
import { CodeEditor } from '../../components/CodeEditor';
import { Step, FileItem, StepType } from '../types';
import { useWebContainer } from '../hooks/useWebContainer';
import { parseXml } from '../types/steps';
import { useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Clipboard, Download, Send } from 'lucide-react';
import { StepsList } from '@/components/StepsList';
import { Loader } from '@/components/Loader';
import { TabView } from '@/components/TabView';
import { PreviewFrame } from '@/components/PreviewFrame';
import Link from 'next/link';

import JSZip from 'jszip';
import { saveAs } from 'file-saver';
export default function Builder() {
  const searchParams = useSearchParams();
  const prompt = searchParams.get('prompt');
  const [userPrompt, setPrompt] = useState("");
  const [llmMessages, setLlmMessages] = useState<{ role: "user" | "assistant", content: string; }[]>([]);
  const [loading, setLoading] = useState(false);
  const [templateSet, setTemplateSet] = useState(false);
  const webcontainer = useWebContainer();
  const route = useRouter()
  const [currentStep, setCurrentStep] = useState(1);
  const [activeTab, setActiveTab] = useState<'code' | 'preview'>('code');
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);

  const [steps, setSteps] = useState<Step[]>([]);

  const [files, setFiles] = useState<FileItem[]>([]);


  interface Message {
    id: number
    content: string
    timestamp: Date
  }


  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')

  const handleSend = () => {
    if (!input.trim()) return

    setMessages([...messages, {
      id: Date.now(),
      content: input,
      timestamp: new Date()
    }])
    setInput('')
  }

  // 1) A recursive updater that returns a new file tree
  function updateFileContent(
    items: FileItem[],
    updated: FileItem
  ): FileItem[] {
    return items.map(item => {
      if (item.type === 'file' && item.path === updated.path) {
        // Replace the file node
        return { ...item, content: updated.content };
      } else if (item.type === 'folder' && item.children) {
        // Recurse into folders
        return {
          ...item,
          children: updateFileContent(item.children, updated),
        };
      }
      return item;
    });
  }



  const handleExportZip = async () => {
    const zip = new JSZip();

    const addFilesToZip = (zipFolder: JSZip, items: FileItem[]) => {
      items.forEach((item) => {
        if (item.type === 'folder' && item.children) {
          const newFolder = zipFolder.folder(item.name);
          if (newFolder) addFilesToZip(newFolder, item.children);
        } else if (item.type === 'file') {
          zipFolder.file(item.name || 'untitled.txt', item.content || '');
        }
      });
    };

    addFilesToZip(zip, files);

    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, `${prompt || 'project'}-export.zip`);
  };


  useEffect(() => {
    let originalFiles = [...files];
    let updateHappened = false;
    steps.filter(({ status }) => status === "pending").map(step => {
      updateHappened = true;
      if (step?.type === StepType.CreateFile) {
        let parsedPath = step.path?.split("/") ?? []; // ["src", "components", "App.tsx"]
        let currentFileStructure = [...originalFiles]; // {}
        let finalAnswerRef = currentFileStructure;

        let currentFolder = ""
        while (parsedPath.length) {
          currentFolder = `${currentFolder}/${parsedPath[0]}`;
          let currentFolderName = parsedPath[0];
          parsedPath = parsedPath.slice(1);

          if (!parsedPath.length) {
            // final file
            let file = currentFileStructure.find(x => x.path === currentFolder)
            if (!file) {
              currentFileStructure.push({
                name: currentFolderName,
                type: 'file',
                path: currentFolder,
                content: step.code
              })
            } else {
              file.content = step.code;
            }
          } else {
            /// in a folder
            let folder = currentFileStructure.find(x => x.path === currentFolder)
            if (!folder) {
              // create the folder
              currentFileStructure.push({
                name: currentFolderName,
                type: 'folder',
                path: currentFolder,
                children: []
              })
            }

            currentFileStructure = currentFileStructure.find(x => x.path === currentFolder)!.children!;
          }
        }
        originalFiles = finalAnswerRef;
      }

    })

    if (updateHappened) {

      setFiles(originalFiles)
      setSteps(steps => steps.map((s: Step) => {
        return {
          ...s,
          status: "completed"
        }

      }))
    }
    // console.log(files);
  }, [steps, files]);

  useEffect(() => {
    const createMountStructure = (files: FileItem[]): Record<string, any> => {
      const mountStructure: Record<string, any> = {};

      const processFile = (file: FileItem, isRootFolder: boolean) => {
        if (file.type === 'folder') {
          // For folders, create a directory entry
          mountStructure[file.name] = {
            directory: file.children ?
              Object.fromEntries(
                file.children.map(child => [child.name, processFile(child, false)])
              )
              : {}
          };
        } else if (file.type === 'file') {
          if (isRootFolder) {
            mountStructure[file.name] = {
              file: {
                contents: file.content || ''
              }
            };
          } else {
            // For files, create a file entry with contents
            return {
              file: {
                contents: file.content || ''
              }
            };
          }
        }

        return mountStructure[file.name];
      };

      // Process each top-level file/folder
      files.forEach(file => processFile(file, true));

      return mountStructure;
    };

    const mountStructure = createMountStructure(files);

    // Mount the structure if WebContainer is available
    // console.log(mountStructure);
    webcontainer?.mount(mountStructure);
  }, [files, webcontainer]);

  async function init() {
    const response = await axios.post(`/api/template`, {
      prompt: prompt?.trim()
    });
    setTemplateSet(true);
    // console.log(response.data)
    const { prompts, uiPrompts } = response.data;

    setSteps(parseXml(uiPrompts[0]).map((x: Step) => ({
      ...x,
      status: "pending"
    })));

    setLoading(true);
    const stepsResponse = await axios.post(`/api/chat`, {
      messages: [...prompts, prompt].map(parts => ({
        role: "user",
        parts
      }))
    })

    setLoading(false);
    // console.log(stepsResponse.data.response)
    setSteps(s => [...s, ...parseXml(stepsResponse.data.response).map(x => ({
      ...x,
      status: "pending" as "pending"
    }))]);

    setLlmMessages([...prompts, prompt].map(content => ({
      role: "user",
      content
    })));

    setLlmMessages(x => [...x, { role: "assistant", content: stepsResponse.data.response }])
  }

  useEffect(() => {
    init();
  }, [])

  return (

    <div className="min-h-screen bg-black flex flex-col">

      <div className="w-full   bg-black border-b border-[#2c2c3a] px-6 py-3 flex justify-between items-center">
        {/* Logo Section */}
        <Link href="/" className="text-white font-bold text-2xl tracking-tight">
          DevKit
        </Link>

        {/* Hamburger Icon */}
        <button
          className="text-white focus:outline-none hover:bg-[#2a2a3d] p-2 rounded transition-all duration-200"
          onClick={() => {
            // Toggle something (like sidebar)
            console.log('Hamburger clicked');
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      <div className='px-4'>
        <p className="text-sm text-white mt-1 italic">Prompt: {prompt}</p>
      </div>


      <main className="flex-1 overflow-hidden">
        <div className="h-full grid grid-cols-4 gap-2 p-2">
          {/* Steps List Section */}
          <div className="col-span-1 bg-[#1a1a1d] rounded-xl p-4 shadow-inner border border-[#2c2c3a] flex flex-col justify-between max-h-[calc(100vh-8rem)]">
            <h2 className="text-lg font-semibold text-white mb-2">🧠 Steps</h2>
            <StepsList steps={steps} currentStep={currentStep} onStepClick={setCurrentStep} />
            <div className="mt-4">
              <h3 className="text-xs text-gray-400 uppercase mb-1">AI Assistant</h3>
              {(loading || !templateSet) ? (
                <Loader />
              ) : (
                <div className="flex space-x-2 items-center mt-2">
                  <Textarea
                    value={userPrompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="What do you want to build?"
                    className="flex-1 bg-[#2a2a3d] text-white border border-[#3b3b4f] placeholder:text-gray-500 resize-none"
                  />
                  <Button variant={'default'}
                    onClick={async () => {
                      const newMessage = { role: 'user' as 'user', content: userPrompt };
                      setLoading(true);
                      setPrompt('');
                      const stepsResponse = await axios.post(`/api/chat`, {
                        messages: [...llmMessages, newMessage],
                      });
                      setLoading(false);

                      setLlmMessages((x) => [...x, newMessage]);
                      setLlmMessages((x) => [...x, { role: 'assistant', content: stepsResponse.data.response }]);
                      setSteps((s) => [
                        ...s,
                        ...parseXml(stepsResponse.data.response).map((x) => ({
                          ...x,
                          status: 'pending' as 'pending',
                        })),
                      ]);
                    }}
                    className=""
                  >
                    Send
                  </Button>
                  <Button type='button' onClick={() => route.push('/whiteboard')}><Clipboard className=" w-6 h-6" />
                  </Button>
                </div>
              )}
            </div>
          </div>


          {/* File Explorer Section */}
          <div className="col-span-1 bg-[#1a1a1d] rounded-xl p-4 text-white border border-[#2c2c3a] shadow-md">
            <div className="flex justify-between mb-2">

              <h2 className="text-lg font-semibold mb-2">📁 File Explorer</h2>
              <Button onClick={handleExportZip} title='download files'>
                <Download />
              </Button>
            </div>
            <FileExplorer files={files} onFileSelect={setSelectedFile} />
          </div>


          {/* Code Editor and Preview Section */}
          <div className="col-span-2 rounded-xl p-4 h-[calc(100vh-8rem)] border border-[#2c2c3a] bg-[#1a1a1d] shadow-xl flex flex-col">
            <TabView activeTab={activeTab} onTabChange={setActiveTab} />
            <div className="flex-1 mt-2 bg-black rounded-lg overflow-auto p-3 border border-[#2a2a3d]">
              {activeTab === 'code' ? (
                // <CodeEditor file={selectedFile} />
                <CodeEditor
                  file={selectedFile}
                  onFileChange={(updatedFile) => {
                    // 2) Use the recursive helper to produce a new `files` array
                    setFiles(oldFiles => updateFileContent(oldFiles, updatedFile));

                    // 3) Make sure `selectedFile` also updates so the editor stays in sync
                    setSelectedFile(updatedFile);
                  }}
                />


              ) : (
                <PreviewFrame webContainer={webcontainer} files={files} />
              )}
            </div>
          </div>

        </div>
      </main>
    </div>


  );
}