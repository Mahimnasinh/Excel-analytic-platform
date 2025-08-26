"use client"

import { useState, useEffect } from "react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  ResponsiveContainer,
} from "recharts"
import Sidebar from "./Sidebar"
import { useAuth } from "../context/authContext"

const Charts = () => {
  const { token } = useAuth()
  const [files, setFiles] = useState([])
  const [selectedFile, setSelectedFile] = useState(null)
  const [fileData, setFileData] = useState(null)
  const [chartConfig, setChartConfig] = useState({
    type: "bar",
    xAxis: "",
    yAxis: "",
  })
  const [loading, setLoading] = useState(true)
  const [dataLoading, setDataLoading] = useState(false)

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82CA9D"]

  useEffect(() => {
    fetchFiles()
  }, [])

  const fetchFiles = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/files", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const data = await response.json()
        setFiles(data.files)
      }
    } catch (error) {
      console.error("Error fetching files:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchFileData = async (fileId) => {
    setDataLoading(true)
    try {
      const response = await fetch(`http://localhost:5000/api/files/${fileId}/data`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const data = await response.json()
        setFileData(data)
        // Reset chart config when new file is selected
        setChartConfig({
          type: "bar",
          xAxis: data.headers?.[0] || "",
          yAxis: data.headers?.[1] || "",
        })
      }
    } catch (error) {
      console.error("Error fetching file data:", error)
    } finally {
      setDataLoading(false)
    }
  }

  const handleFileSelect = (file) => {
    setSelectedFile(file)
    fetchFileData(file._id)
  }

  const prepareChartData = () => {
    if (!fileData || !chartConfig.xAxis || !chartConfig.yAxis) return []

    const xIndex = fileData.headers.indexOf(chartConfig.xAxis)
    const yIndex = fileData.headers.indexOf(chartConfig.yAxis)

    if (xIndex === -1 || yIndex === -1) return []

    const dataMap = new Map()

    fileData.rows.forEach((row) => {
      const xValue = row[xIndex]
      const yValue = Number.parseFloat(row[yIndex])

      if (xValue && !isNaN(yValue)) {
        if (dataMap.has(xValue)) {
          dataMap.set(xValue, dataMap.get(xValue) + yValue)
        } else {
          dataMap.set(xValue, yValue)
        }
      }
    })

    return Array.from(dataMap.entries())
      .map(([name, value]) => ({
        name: String(name),
        value: value,
      }))
      .slice(0, 20) // Limit to 20 items for better visualization
  }

  const renderChart = () => {
    const data = prepareChartData()

    if (data.length === 0) {
      return (
        <div className="empty-chart">
          <p>No data available for the selected configuration</p>
        </div>
      )
    }

    switch (chartConfig.type) {
      case "bar":
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        )

      case "pie":
        return (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        )

      case "line":
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="value" stroke="#8884d8" />
            </LineChart>
          </ResponsiveContainer>
        )

      default:
        return null
    }
  }

  return (
    <div className="dashboard-container">
      <Sidebar />

      <main className="dashboard-main">
        <div className="charts-container">
          <div className="charts-header">
            <h1>Charts</h1>
            <p>Create interactive visualizations from your Excel data</p>
          </div>

          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Loading files...</p>
            </div>
          ) : (
            <div className="charts-content">
              <div className="chart-controls">
                <div className="control-group">
                  <label>Select File:</label>
                  <select
                    value={selectedFile?._id || ""}
                    onChange={(e) => {
                      const file = files.find((f) => f._id === e.target.value)
                      if (file) handleFileSelect(file)
                    }}
                    className="control-select"
                  >
                    <option value="">Choose a file...</option>
                    {files.map((file) => (
                      <option key={file._id} value={file._id}>
                        {file.filename}
                      </option>
                    ))}
                  </select>
                </div>

                {fileData && (
                  <>
                    <div className="control-group">
                      <label>Chart Type:</label>
                      <select
                        value={chartConfig.type}
                        onChange={(e) => setChartConfig({ ...chartConfig, type: e.target.value })}
                        className="control-select"
                      >
                        <option value="bar">Bar Chart</option>
                        <option value="pie">Pie Chart</option>
                        <option value="line">Line Chart</option>
                      </select>
                    </div>

                    <div className="control-group">
                      <label>X-Axis (Categories):</label>
                      <select
                        value={chartConfig.xAxis}
                        onChange={(e) => setChartConfig({ ...chartConfig, xAxis: e.target.value })}
                        className="control-select"
                      >
                        <option value="">Select column...</option>
                        {fileData.headers.map((header, index) => (
                          <option key={index} value={header}>
                            {header}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="control-group">
                      <label>Y-Axis (Values):</label>
                      <select
                        value={chartConfig.yAxis}
                        onChange={(e) => setChartConfig({ ...chartConfig, yAxis: e.target.value })}
                        className="control-select"
                      >
                        <option value="">Select column...</option>
                        {fileData.headers.map((header, index) => (
                          <option key={index} value={header}>
                            {header}
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                )}
              </div>

              {selectedFile && (
                <div className="chart-display">
                  <div className="chart-header">
                    <h3>
                      {selectedFile.filename} - {chartConfig.type.charAt(0).toUpperCase() + chartConfig.type.slice(1)}{" "}
                      Chart
                    </h3>
                    {chartConfig.xAxis && chartConfig.yAxis && (
                      <p>
                        {chartConfig.xAxis} vs {chartConfig.yAxis}
                      </p>
                    )}
                  </div>

                  {dataLoading ? (
                    <div className="loading-container">
                      <div className="loading-spinner"></div>
                      <p>Loading data...</p>
                    </div>
                  ) : (
                    <div className="chart-wrapper">{renderChart()}</div>
                  )}
                </div>
              )}

              {!selectedFile && files.length > 0 && (
                <div className="empty-state">
                  <div className="empty-icon">📈</div>
                  <h3>Select a file to create charts</h3>
                  <p>Choose a file from the dropdown above to start creating visualizations</p>
                </div>
              )}

              {files.length === 0 && (
                <div className="empty-state">
                  <div className="empty-icon">📁</div>
                  <h3>No files uploaded</h3>
                  <p>
                    <a href="/upload">Upload your first Excel file</a> to create charts
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default Charts
