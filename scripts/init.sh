git config core.hooksPath ./.githooks
echo -e "New hooks path: $(git config core.hooksPath)\n"

cp .env.example .env
echo -e "Environment variables copied from .env.example to .env"