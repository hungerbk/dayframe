import Timetable from "@/components/timetable/Timetable";
import LanguageSelector from "@/components/ui/LanguageSelector";
import HelpButton from "@/components/ui/HelpButton";

function App() {
  return (
    <main className="relative min-h-screen flex items-center justify-center bg-page transition-colors duration-300">
      <div className="absolute top-4 right-4 flex items-center gap-1">
        <HelpButton />
        <LanguageSelector />
      </div>
      <Timetable />
    </main>
  );
}

export default App;
