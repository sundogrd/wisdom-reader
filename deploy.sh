yarn build
echo "builded"

rm -rf /usr/share/nginx/reader
echo "deleted old files"
mv ./build /usr/share/nginx/reader
echo "moved directory"
service nginx restart
echo "nginx restarted"
