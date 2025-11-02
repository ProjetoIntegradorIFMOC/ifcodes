import type { Problem } from "@/types";
import { X, Clock, HardDrive, Codesandbox } from "lucide-react";
import { Label } from "@/components/ui/label";
import { RichTextViewer } from "@/components/RichTextEditor";


// Modal de visualização
interface ProblemViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  problem: Problem | null;
}

export default function ProblemViewModal({ isOpen, onClose, problem }: ProblemViewModalProps) {
  if (!isOpen || !problem) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between border-b border-gray-200 pb-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <Codesandbox className="w-6 h-6 mr-3 text-gray-600" />
              {problem.title}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2">Enunciado</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <RichTextViewer value={problem.statement} />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold mb-2">Tempo Limite</h3>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>{problem.timeLimitMs} milissegundos</span>
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Memória Limite</h3>
                <div className="flex items-center gap-2">
                  <HardDrive className="w-4 h-4" />
                  <span>{problem.memoryLimitKb} KB</span>
                </div>
              </div>
            </div>
            
            {problem.testCases && problem.testCases.length > 0 && (
              <div>
                <h3 className="font-semibold mb-4">Casos de Teste</h3>
                <div className="space-y-4">
                  {problem.testCases.map((testCase, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-medium">Caso {index + 1}</h4>
                        {testCase.private && (
                          <span className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded">
                            Privado
                          </span>
                        )}
                      </div>
                      <div className="space-y-3">
                        <div>
                          <Label className="text-xs font-medium">Entrada</Label>
                          <div className="bg-gray-50 p-3 rounded mt-1">
                            <pre className="text-sm">{testCase.input}</pre>
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs font-medium">Saída Esperada</Label>
                          <div className="bg-gray-50 p-3 rounded mt-1">
                            <pre className="text-sm">{testCase.expectedOutput}</pre>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
