import Timetable from "@/components/timetable/Timetable";
import LanguageSelector from "@/components/ui/LanguageSelector";
import HelpButton from "@/components/ui/HelpButton";

function App() {
  return (
    <main className="relative min-h-screen flex items-center justify-center bg-page transition-colors duration-300">
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between lg:justify-end gap-1 p-4">
        <HelpButton />
        <LanguageSelector />
      </div>
      <Timetable />
    </main>
  );
}

export default App;
