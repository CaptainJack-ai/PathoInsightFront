function WorkflowPage() {
  return (
    <main className="min-h-screen w-screen bg-blue-100 px-6 py-10 md:px-10">
      <div className="mx-auto w-full max-w-4xl rounded-xl border border-black/10 bg-white p-6 md:p-8">
        <h1 className="font-zentry text-5xl uppercase text-black md:text-7xl">
          PathoInsight Workflow
        </h1>
        <p className="mt-4 max-w-2xl font-circular-web text-black/70">
          Route and API integration are ready. Workflow visual page implementation
          will be added in the next step.
        </p>
        <div className="mt-6 rounded-lg bg-black/5 p-4 text-sm text-black/70">
          This page is intentionally minimal at this phase. Use the API service in
          <span className="font-semibold text-black"> src/api/workflowApi.js</span> for upload,
          status query, and polling.
        </div>
      </div>
    </main>
  );
}

export default WorkflowPage;
