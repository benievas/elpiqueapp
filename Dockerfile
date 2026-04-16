FROM node:22-alpine

WORKDIR /app

# Copy package files
COPY package*.json .npmrc ./

# Install dependencies
RUN npm ci --legacy-peer-deps

# Copy source
COPY . .

# Build args for Next.js public env vars (needed at build time)
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_APP_URL=https://elpiqueapp.com
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL

# Build
RUN npm run build

# Expose port
EXPOSE 3000

# Start
CMD ["npm", "run", "start"]
