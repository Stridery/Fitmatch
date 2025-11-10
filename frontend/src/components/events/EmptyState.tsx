import { Calendar } from 'lucide-react';

interface EmptyStateProps {
  message?: string;
  description?: string;
}

export function EmptyState({ message = 'No events found', description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <Calendar className="h-12 w-12 text-gray-400 mb-4" />
      <h3 className="text-lg font-semibold text-gray-300 mb-2">{message}</h3>
      {description && (
        <p className="text-sm text-gray-400 text-center max-w-md">{description}</p>
      )}
    </div>
  );
}


