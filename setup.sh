echo 'ctrl+d for cancel'

echo "Should I initialize private .gitconfig's user credentials for this repo? y/n"
read ans
if [[ "$ans" == y* ]]; then
       echo Username? && read username && git config user.name $username
       echo email? && read email && git config user.email $email
fi

cat .git/config
