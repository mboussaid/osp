for id in {0..100}; do
  echo $id;
  pactl unload-module $id 2>/dev/null;
done
