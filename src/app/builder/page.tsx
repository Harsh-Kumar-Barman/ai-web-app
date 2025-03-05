'use client'

import React, { useEffect, useState } from 'react';
import { FileExplorer } from '../../components/FileExplorer';
import { CodeEditor } from '../../components/CodeEditor';
import { Step, FileItem, StepType } from '../types';
import { useWebContainer } from '../hooks/useWebContainer';
import { parseXml } from '../types/steps';
import { useSearchParams } from 'next/navigation';
import axios from 'axios';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';
import { StepsList } from '@/components/StepsList';
import { Loader } from '@/components/Loader';
import { TabView } from '@/components/TabView';
import { PreviewFrame } from '@/components/PreviewFrame';

export default function Builder() {
  const searchParams = useSearchParams();
  const prompt = searchParams.get('prompt');
  const [userPrompt, setPrompt] = useState("");
  const [llmMessages, setLlmMessages] = useState<{ role: "user" | "assistant", content: string; }[]>([]);
  const [loading, setLoading] = useState(false);
  const [templateSet, setTemplateSet] = useState(false);
  const webcontainer = useWebContainer();

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
    // <div className="min-h-screen bg-gray-900 flex flex-col">
    //   <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
    //     <h1 className="text-xl font-semibold text-gray-100">Website Builder</h1>
    //     <p className="text-sm text-gray-400 mt-1">Prompt: {prompt}</p>
    //   </header>

    //   <div className="flex-1 overflow-hidden">
    //     <div className="h-full grid grid-cols-4 gap-6 p-6">
    //       <div className="col-span-1 space-y-6 overflow-auto">
    //         <div>
    //           <div className="max-h-[75vh] overflow-scroll">
    //             <StepsList
    //               steps={steps}
    //               currentStep={currentStep}
    //               onStepClick={setCurrentStep}
    //             />
    //           </div>
    //           <div>
    //             <div className='flex'>
    //               <br />
    //               {(loading || !templateSet) && <Loader />}
    //               {!(loading || !templateSet) && <div className='flex'>
    //                 <textarea value={userPrompt} onChange={(e) => {
    //                 setPrompt(e.target.value)
    //               }} className='p-2 w-full'></textarea>
    //               <button onClick={async () => {
    //                 const newMessage = {
    //                   role: "user" as "user",
    //                   content: userPrompt
    //                 };

    //                 setLoading(true);
    //                 const stepsResponse = await axios.post(`/api/chat`, {
    //                   messages: [...llmMessages, newMessage]
    //                 });
    //                 setLoading(false);

    //                 setLlmMessages(x => [...x, newMessage]);
    //                 setLlmMessages(x => [...x, {
    //                   role: "assistant",
    //                   content: stepsResponse.data.response
    //                 }]);

    //                 setSteps(s => [...s, ...parseXml(stepsResponse.data.response).map(x => ({
    //                   ...x,
    //                   status: "pending" as "pending"
    //                 }))]);

    //               }} className='bg-purple-400 px-4'>Send</button>
    //               </div>}
    //             </div>
    //           </div>
    //         </div>
    //       </div>
    //       <div className="col-span-1">
    //           <FileExplorer 
    //             files={files} 
    //             onFileSelect={setSelectedFile}
    //           />
    //         </div>
    //       <div className="col-span-2 bg-gray-900 rounded-lg shadow-lg p-4 h-[calc(100vh-8rem)]">
    //         <TabView activeTab={activeTab} onTabChange={setActiveTab} />
    //         <div className="h-[calc(100%-4rem)]">
    //           {activeTab === 'code' ? (
    //             <CodeEditor file={selectedFile} />
    //           ) : (
    //             <PreviewFrame webContainer={webcontainer} files={files} />
    //           )}
    //         </div>
    //       </div>
    //     </div>
    //   </div>
    // </div>





    <div className="min-h-screen bg-gray-900 flex flex-col">
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4 shadow-lg">
        <h1 className="text-2xl font-bold text-purple-400">Website Builder</h1>
        <p className="text-sm text-gray-400 mt-1">Prompt: {prompt}</p>
      </header>

      <main className="flex-1 overflow-hidden">
        <div className="h-full grid grid-cols-4 gap-2 p-2">
          {/* Steps List Section */}
          <div className="col-span-1 text-white bg-gray-800 flex flex-col justify-between rounded-lg p-4 max-h-[calc(100vh-8rem)] overflow-auto">
            <h2 className="text-lg font-semibold">Steps</h2>
            <div className="space-y-2">
              <StepsList steps={steps} currentStep={currentStep} onStepClick={setCurrentStep} />
            </div>
            <div className="">
              <h3 className="text-sm">AI Assistant</h3>
              <div className="mt-2">
                {(loading || !templateSet) && <Loader />}
                {!(loading || !templateSet) && (
                  <div className="flex items-center space-x-2">
                    <Textarea
                      value={userPrompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      className="p-2 w-full rounded-md text-sm border outline-none"
                      placeholder="Enter your prompt here..."
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
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* File Explorer Section */}
          <div className="col-span-1 bg-gray-800 rounded-lg p-2 text-white">
            <h2 className="text-lg font-semibold">File Explorer</h2>
            <FileExplorer files={files} onFileSelect={setSelectedFile} />
          </div>

          {/* Code Editor and Preview Section */}
          <div className="col-span-2 rounded-lg shadow-lg p-4 h-[calc(100vh-8rem)]">
            <TabView activeTab={activeTab} onTabChange={setActiveTab} />
            <div className="h-[calc(100%-4rem)] bg-gray-800 rounded-lg shadow-inner p-4 overflow-auto">
              {activeTab === 'code' ? (
                <CodeEditor file={selectedFile} />
              ) : (
                <PreviewFrame webContainer={webcontainer} files={files} />
              )}
            </div>
          </div>
        </div>
      </main>
    </div>




    // <div className="min-h-screen flex flex-col">
    //   <header className="bg-gray-800 border-b border-gray-700 px-6 py-4 shadow-lg">
    //     <h1 className="text-2xl font-bold text-purple-400">Website Builder</h1>
    //     <p className="text-sm text-gray-400 mt-1">Prompt: {prompt}</p>
    //   </header>

    //   <main className="flex-1 overflow-hidden">
    //     <div className="h-full grid grid-cols-4 gap-4 p-4">
    //       {/* Chat Section */}
    //       <div className="flex flex-col rounded-lg border bg-card shadow-sm">
    //         <div className="border-b p-4">
    //           <h2 className="text-lg font-semibold">Chat with Project Development</h2>
    //         </div>
    //         <ScrollArea className="flex-1 p-4">
    //           <div className="space-y-4">
    //             {messages.map((message) => (
    //               <div key={message.id} className="rounded-lg bg-muted p-3">
    //                 <p className="text-sm">{message.content}</p>
    //                 <span className="text-xs text-muted-foreground">
    //                   {message.timestamp.toLocaleTimeString()}
    //                 </span>
    //               </div>
    //             ))}
    //           </div>
    //         </ScrollArea>
    //         <div className="border-t p-4">
    //           <div className="flex gap-2">
    //             <Textarea
    //               value={input}
    //               onChange={(e) => setInput(e.target.value)}
    //               placeholder="Type a message or command..."
    //               className="min-h-[80px]"
    //             />
    //             <Button onClick={handleSend} className="self-end">
    //               <Send className="h-4 w-4" />
    //             </Button>
    //           </div>
    //         </div>
    //       </div>

    //       {/* Steps List Section */}
    //       <div className="col-span-1 border bg-card flex flex-col rounded-lg p-4 max-h-[calc(100vh-8rem)] overflow-auto">
    //         <h2 className="text-lg font-semibold">Steps</h2>
    //         <div className="space-y-2">
    //           <StepsList steps={steps} currentStep={currentStep} onStepClick={setCurrentStep} />
    //         </div>
    //         <div>
    //           <h3 className="text-sm">AI Assistant</h3>
    //           <div className="mt-2">
    //             {(loading || !templateSet) && <Loader />}
    //             {!(loading || !templateSet) && (
    //               <div className="flex items-center space-x-2">
    //                 <Textarea
    //                   value={userPrompt}
    //                   onChange={(e) => setPrompt(e.target.value)}
    //                   className="p-2 w-full rounded-md text-sm border outline-none"
    //                   placeholder="Enter your prompt here..."
    //                 />
    //                 <Button variant={'default'}
    //                   onClick={async () => {
    //                     const newMessage = { role: 'user' as 'user', content: userPrompt };
    //                     setLoading(true);
    //                     setPrompt('');
    //                     const stepsResponse = await axios.post(`/api/chat`, {
    //                       messages: [...llmMessages, newMessage],
    //                     });
    //                     setLoading(false);

    //                     setLlmMessages((x) => [...x, newMessage]);
    //                     setLlmMessages((x) => [...x, { role: 'assistant', content: stepsResponse.data.response }]);
    //                     setSteps((s) => [
    //                       ...s,
    //                       ...parseXml(stepsResponse.data.response).map((x) => ({
    //                         ...x,
    //                         status: 'pending' as 'pending',
    //                       })),
    //                     ]);
    //                   }}
    //                   className=""
    //                 >
    //                   Send
    //                 </Button>
    //               </div>
    //             )}
    //           </div>
    //         </div>
    //       </div>

    //       {/* File Explorer Section */}
    //       <div className="col-span-1 border rounded-lg p-4">
    //         <h2 className="text-lg font-semibold">File Explorer</h2>
    //         <FileExplorer files={files} onFileSelect={setSelectedFile} />
    //       </div>

    //       {/* Code Editor and Preview Section */}
    //       <div className="col-span-2 border rounded-lg p-4 h-[calc(100vh-8rem)]">
    //         <TabView activeTab={activeTab} onTabChange={setActiveTab} />
    //         <div className="h-[calc(100%-4rem)] border rounded-xl shadow-inner p-4 overflow-auto">
    //           {activeTab === 'code' ? (
    //             <CodeEditor file={selectedFile} />
    //           ) : (
    //             <PreviewFrame webContainer={webcontainer} files={files} />
    //           )}
    //         </div>
    //       </div>
    //     </div>
    //   </main>
    // </div>

  );
}