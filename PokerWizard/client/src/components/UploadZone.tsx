import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, File, X } from "lucide-react";

export default function UploadZone() {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<File[]>([]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    setFiles(prev => [...prev, ...droppedFiles]);
    console.log('Files dropped:', droppedFiles);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...selectedFiles]);
      console.log('Files selected:', selectedFiles);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleAnalyze = () => {
    console.log('Analyzing files:', files);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Card
        className={`border-2 border-dashed transition-colors ${
          isDragging ? "border-primary bg-primary/5" : "border-border"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <CardContent className="flex flex-col items-center justify-center min-h-[300px] p-8">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Upload className="w-8 h-8 text-primary" />
          </div>
          
          <h3 className="text-xl font-semibold text-foreground mb-2">
            Arraste seus arquivos aqui
          </h3>
          
          <p className="text-muted-foreground mb-6 text-center">
            Ou clique no botão abaixo para selecionar
          </p>

          <input
            type="file"
            id="file-upload"
            className="hidden"
            accept=".txt,.csv,.hand"
            multiple
            onChange={handleFileInput}
            data-testid="input-file-upload"
          />
          
          <label htmlFor="file-upload">
            <Button asChild data-testid="button-select-files">
              <span>Selecionar Arquivos</span>
            </Button>
          </label>

          <p className="text-sm text-muted-foreground mt-4">
            Formatos aceitos: .txt, .csv, .hand
          </p>
        </CardContent>
      </Card>

      {files.length > 0 && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <h4 className="font-semibold text-foreground">
              Arquivos Selecionados ({files.length})
            </h4>
            
            <div className="space-y-2">
              {files.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  data-testid={`file-item-${index}`}
                >
                  <div className="flex items-center gap-3">
                    <File className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(file.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFile(index)}
                    data-testid={`button-remove-file-${index}`}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>

            <Button
              className="w-full"
              size="lg"
              onClick={handleAnalyze}
              data-testid="button-analyze"
            >
              Analisar Agora
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
