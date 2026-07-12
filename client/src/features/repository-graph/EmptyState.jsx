/**
 * @typedef {Object} EmptyStateProps
 * @property {string} [message] - Optional message to display.
 */

/**
 * EmptyState – shows when the repository graph has no data.
 *
 * @param {EmptyStateProps} props
 */
export function EmptyState({ message = 'No data to display.' }) {
  return (
    <div className="flex items-center justify-center h-full text-gray-500">
      {message}
    </div>
  );
}

export function LoadingState({ message = 'Loading...' }) {
  return (
    <div className="flex items-center justify-center h-full text-gray-400">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400 mr-3"></div>
      {message}
    </div>
  );
}
