for id in {0..500}; do
  echo $id;
  pactl unload-module $id 2>/dev/null;
done
pulseaudio --kill
pulseaudio --start