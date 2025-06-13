import { WebContainer } from '@webcontainer/api';
import React, { useEffect, useState } from 'react';

interface PreviewFrameProps {
  files: any[];
  webContainer: WebContainer;
}

export function PreviewFrame({ files, webContainer }: PreviewFrameProps) {
  console.log("preview --->>  ",files[9].children[0].content)
  // In a real implementation, this would compile and render the preview
  const [url, setUrl] = useState("");

  async function main() {
    const installProcess = await webContainer.spawn('npm', ['install']);

    installProcess.output.pipeTo(new WritableStream({
      write(data) {
        console.log(data);
      }
    }));

    await webContainer.spawn('npm', ['run', 'dev']);

    // Wait for `server-ready` event
    webContainer.on('server-ready', (port, url) => {
      // ...
      console.log(url)
      console.log(port)
      setUrl(url);
    });
  }

  useEffect(() => {
    main()
  }, [])
  return (
    <div className="h-full flex items-center justify-center text-gray-400">
      {!url && <div className="text-center">
        <div className="w-8 h-8 border-4 border-gray-300 border-t-green-600 rounded-full animate-spin" />
        <p className="mb-2">Loading...</p>
      </div>}
      {url && <iframe width={"100%"} height={"100%"} src={url} />}
    </div>
  );
}