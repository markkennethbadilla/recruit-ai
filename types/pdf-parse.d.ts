declare module "pdf-parse" {
  interface PDFData {
    numpages: number;
    numrender: number;
    info: Record<string, unknown>;
    metadata: Record<string, unknown>;
    text: string;
    version: string;
  }

  function pdfParse(dataBuffer: Buffer): Promise<PDFData>;
  export default pdfParse;
}

declare module "pdf-parse/lib/pdf-parse.js" {
  function pdfParse(dataBuffer: Buffer): Promise<{
    numpages: number;
    info: Record<string, unknown>;
    text: string;
  }>;
  export default pdfParse;
}
