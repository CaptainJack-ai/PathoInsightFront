import { useEffect, useRef, useState } from "react";
import {
  getJobStatus,
  isKnownStage,
  uploadWSI,
  WORKFLOW_STAGES,
} from "../api/workflowApi";

const POLL_INTERVAL_MS = 2000;

function WorkflowPage() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [jobId, setJobId] = useState("");
  const [statusData, setStatusData] = useState(null);
  const [error, setError] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const pollingRef = useRef(null);

  const clearPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  };

  useEffect(() => {
    return () => clearPolling();
  }, []);

  const handleUpload = async () => {
    if (!selectedFile) {
      setError("Please select a WSI file first.");
      return;
    }

    setError("");
    setIsUploading(true);
    clearPolling();

    try {
      const data = await uploadWSI(selectedFile);
      setJobId(data.jobId || "");
      setStatusData(null);
    } catch (err) {
      setError(err.message || "Upload failed.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleQueryOnce = async () => {
    if (!jobId) {
      setError("Please input a valid jobId.");
      return;
    }

    setError("");

    try {
      const data = await getJobStatus(jobId);
      setStatusData(data);
    } catch (err) {
      setError(err.message || "Query failed.");
    }
  };

  const handleTogglePolling = async () => {
    if (isPolling) {
      clearPolling();
      setIsPolling(false);
      return;
    }

    if (!jobId) {
      setError("Please input a valid jobId.");
      return;
    }

    setError("");
    setIsPolling(true);

    await handleQueryOnce();

    pollingRef.current = setInterval(async () => {
      try {
        const data = await getJobStatus(jobId);
        setStatusData(data);

        if (data?.stage === "done") {
          clearPolling();
          setIsPolling(false);
        }
      } catch (err) {
        setError(err.message || "Polling failed.");
        clearPolling();
        setIsPolling(false);
      }
    }, POLL_INTERVAL_MS);
  };

  const stage = statusData?.stage;
  const progress = statusData?.progress;
  const result = statusData?.result;

  return (
    <main className="min-h-screen w-screen bg-blue-100 px-6 py-10 md:px-10">
      <div className="mx-auto w-full max-w-5xl">
        <h1 className="font-zentry text-5xl uppercase text-black md:text-7xl">
          PathoInsight Workflow
        </h1>
        <p className="mt-3 max-w-2xl font-circular-web text-black/70">
          Upload WSI, track backend stage updates, and render process animation
          based on stage transitions.
        </p>

        <section className="mt-8 rounded-xl border border-black/10 bg-white p-5">
          <h2 className="font-general text-sm uppercase text-black/70">1. Upload WSI</h2>
          <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center">
            <input
              type="file"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              className="w-full rounded border border-black/20 px-3 py-2 text-sm"
            />
            <button
              onClick={handleUpload}
              disabled={isUploading}
              className="rounded bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
            >
              {isUploading ? "Uploading..." : "Upload"}
            </button>
          </div>
          {jobId && (
            <p className="mt-3 text-sm text-black/70">
              Received jobId: <span className="font-semibold text-black">{jobId}</span>
            </p>
          )}
        </section>

        <section className="mt-6 rounded-xl border border-black/10 bg-white p-5">
          <h2 className="font-general text-sm uppercase text-black/70">2. Query Stage</h2>
          <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center">
            <input
              type="text"
              value={jobId}
              onChange={(e) => setJobId(e.target.value)}
              placeholder="Input jobId"
              className="w-full rounded border border-black/20 px-3 py-2 text-sm"
            />
            <button
              onClick={handleQueryOnce}
              className="rounded bg-black px-4 py-2 text-sm text-white"
            >
              Query Once
            </button>
            <button
              onClick={handleTogglePolling}
              className="rounded bg-yellow-300 px-4 py-2 text-sm text-black"
            >
              {isPolling ? "Stop Polling" : "Start Polling"}
            </button>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2 md:grid-cols-4">
            {WORKFLOW_STAGES.map((item) => {
              const isActive = stage === item;
              return (
                <div
                  key={item}
                  className={`rounded border px-3 py-2 text-xs uppercase ${
                    isActive
                      ? "border-black bg-black text-white"
                      : "border-black/15 bg-black/5 text-black/60"
                  }`}
                >
                  {item}
                </div>
              );
            })}
          </div>

          {typeof progress === "number" && (
            <div className="mt-4">
              <div className="h-2 w-full rounded bg-black/10">
                <div
                  className="h-2 rounded bg-black"
                  style={{ width: `${Math.max(0, Math.min(100, progress * 100))}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-black/60">
                Progress: {(progress * 100).toFixed(1)}%
              </p>
            </div>
          )}

          {stage && !isKnownStage(stage) && (
            <p className="mt-3 text-xs text-red-600">Unknown stage returned: {stage}</p>
          )}
        </section>

        <section className="mt-6 rounded-xl border border-black/10 bg-white p-5">
          <h2 className="font-general text-sm uppercase text-black/70">3. Result Snapshot</h2>
          <pre className="mt-4 overflow-auto rounded bg-black p-4 text-xs text-white">
            {JSON.stringify(result || {}, null, 2)}
          </pre>
        </section>

        {error && (
          <p className="mt-4 rounded border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}
      </div>
    </main>
  );
}

export default WorkflowPage;
