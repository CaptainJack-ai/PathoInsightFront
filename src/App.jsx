import AppRoutes from "./routes/AppRoutes";
import NavBar from "./components/Navbar";
import RaggyAssistant from "./components/RaggyAssistant";

function App() {
  return (
    <>
      <NavBar />
      <AppRoutes />
      <RaggyAssistant />
    </>
  );
}

export default App;
