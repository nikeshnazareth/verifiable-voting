COLORS=(
  'F0AC46'
  'F7629C'
  '7D66FF'
  '87562B'
  '33C9FF'
  'D1A7D1'
  '78909C'
  'DE5C0B'
  'E66750'  
  '4AB5D9'
  '52A363'
)

for  c in ${COLORS[@]}; do
  cat fingerprint.svg | sed s/000000/$c\;stroke:\#000000/ > fingerprint.$c.svg
done; 


