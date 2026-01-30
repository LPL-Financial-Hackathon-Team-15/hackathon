export default function ExampleComponent({ title, description }) {
  return (
    <div className="p-4 border border-gray-200 rounded-lg shadow-sm">
      <h2 className="text-xl font-semibold text-gray-800 mb-2">{title}</h2>
      <p className="text-gray-600">{description}</p>
    </div>
  )
}
