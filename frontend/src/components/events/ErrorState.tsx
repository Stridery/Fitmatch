import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ message = 'Something went wrong', onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <AlertCircle className="h-12 w-12 text-red-400 mb-4" />
      <h3 className="text-lg font-semibold text-gray-300 mb-2">{message}</h3>
      {onRetry && (
        <Button
          onClick={onRetry}
          variant="outline"
          className="mt-4 bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
        >
          Try Again
        </Button>
      )}
    </div>
  );
}


