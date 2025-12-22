import AdPlaceholder from '../AdPlaceholder';

export default function AdPlaceholderExample() {
  const handleWatchAd = () => {
    console.log('Ad watched, credit earned');
  };

  return (
    <div className="p-6 bg-background">
      <AdPlaceholder onWatchAd={handleWatchAd} />
    </div>
  );
}
