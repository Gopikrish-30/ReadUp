declare global {
  interface Window {
    pdfjsLib: {
      getDocument: (options: {
        data: ArrayBuffer
        cMapUrl?: string
        cMapPacked?: boolean
        enableXfa?: boolean
        disableAutoFetch?: boolean
        disableStream?: boolean
        disableRange?: boolean
      }) => { promise: Promise<any> }
      GlobalWorkerOptions: {
        workerSrc: string
      }
      version: string
    }
  }
}

export {}
