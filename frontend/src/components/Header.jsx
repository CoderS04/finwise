export default function Header({ title, subtitle }) {
  return (
    <div className="mb-8">
      <h1 className="text-3xl lg:text-4xl font-bold text-gray-800 mb-2">{title}</h1>
      <p className="text-gray-600">{subtitle}</p>
    </div>
  )
}
