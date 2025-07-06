export default function TestStyles() {
  return (
    <div className="min-h-screen bg-red-500 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-4xl font-bold text-white text-center">
          Tailwind CSS 测试页面
        </h1>

        {/* 基础 Tailwind 样式测试 */}
        <div className="bg-white rounded-lg p-6 shadow-lg">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            基础样式测试
          </h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-blue-500 text-white p-4 rounded">蓝色背景</div>
            <div className="bg-green-500 text-white p-4 rounded">绿色背景</div>
            <div className="bg-purple-500 text-white p-4 rounded">紫色背景</div>
          </div>
        </div>

        {/* 按钮样式测试 */}
        <div className="bg-white rounded-lg p-6 shadow-lg">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            按钮样式测试
          </h2>
          <div className="flex flex-wrap gap-4">
            <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
              Primary Button
            </button>
            <button className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded">
              Secondary Button
            </button>
            <button className="border border-gray-400 hover:bg-gray-100 text-gray-800 font-bold py-2 px-4 rounded">
              Outline Button
            </button>
          </div>
        </div>

        {/* 响应式测试 */}
        <div className="bg-white rounded-lg p-6 shadow-lg">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            响应式测试
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-yellow-400 p-4 rounded text-center">
              1 列 (手机)
            </div>
            <div className="bg-orange-400 p-4 rounded text-center">
              2 列 (平板)
            </div>
            <div className="bg-pink-400 p-4 rounded text-center">
              4 列 (桌面)
            </div>
            <div className="bg-indigo-400 p-4 rounded text-center text-white">
              响应式
            </div>
          </div>
        </div>

        {/* 如果显示红色背景，说明 Tailwind 正常工作 */}
        <div className="text-center text-white text-lg">
          如果你看到红色背景和彩色卡片，说明 Tailwind CSS 正常工作！
        </div>
      </div>
    </div>
  );
}
