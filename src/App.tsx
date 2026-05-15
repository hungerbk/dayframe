import Timetable from "@/components/timetable/Timetable";
import LanguageSelector from "@/components/ui/LanguageSelector";

function App() {
  return (
    <main className="relative min-h-screen flex items-center justify-center bg-page transition-colors duration-300">
      <div className="absolute top-4 right-4">
        <LanguageSelector />
      </div>
      <Timetable />
    </main>
  );
}

export default App;
