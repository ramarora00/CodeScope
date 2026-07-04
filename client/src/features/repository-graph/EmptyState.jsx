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
