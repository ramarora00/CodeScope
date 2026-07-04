/**
 * @typedef {Object} LoadingStateProps
 * @property {string} [message] - Optional loading message.
 */

/**
 * LoadingState – shows a loading spinner/message while data is fetching.
 *
 * @param {LoadingStateProps} props
 */
export function LoadingState({ message = 'Loading…' }) {
  return (
    <div className="flex items-center justify-center h-full text-gray-500">
      {message}
    </div>
  );
}
