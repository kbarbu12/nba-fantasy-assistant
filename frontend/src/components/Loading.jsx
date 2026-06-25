export default function Loading({ message = 'Loading...' }) {
  return (
    <div className="loading">
      <div className="spinner"></div>
      {message}
    </div>
  );
}
