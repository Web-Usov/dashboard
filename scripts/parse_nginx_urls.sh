#!/bin/bash

# Create temporary directory for nginx configs
TEMP_DIR=$(mktemp -d)
trap 'rm -rf "$TEMP_DIR"' EXIT

# Check if SSH_SOURCE is set
if [ -z "$SSH_SOURCE" ]; then
    echo "Error: SSH_SOURCE environment variable is not set"
    exit 1
fi

# Copy nginx config files
echo "Copying nginx configuration files..."
if [[ "$SSH_SOURCE" == "./"* ]]; then
    # Local files
    cp "$SSH_SOURCE"/*.conf "$TEMP_DIR/" || {
        echo "Error: Failed to copy local configuration files"
        exit 1
    }
else
    # Remote files via SSH
    scp -r "$SSH_SOURCE/*.conf" "$TEMP_DIR/" || {
        echo "Error: Failed to copy nginx configuration files from remote server"
        exit 1
    }
fi

# Path to the output JSON file
OUTPUT_FILE="data/links.json"

# Ensure the directory exists
mkdir -p "$(dirname "$OUTPUT_FILE")"

# Create a temporary file for storing URLs and metadata
TEMP_FILE=$(mktemp)

echo "Processing Nginx configuration files..."

# Function to generate title from subdomain
generate_title() {
    local domain="$1"
    # Extract subdomain (everything before the first dot)
    local subdomain=$(echo "$domain" | cut -d. -f1)
    # Capitalize first letter and replace hyphens with spaces
    echo "$subdomain" | awk '{for(i=1;i<=NF;i++){ $i=toupper(substr($i,1,1)) tolower(substr($i,2))}}1' | sed 's/-/ /g'
}

# Initialize output file with opening JSON
echo "{" > "$OUTPUT_FILE"
echo "  \"links\": [" >> "$OUTPUT_FILE"

# Initialize id counter
id=1
first_entry=true

# Process custom links first
CUSTOM_LINKS_FILE="data/custom-links.json"
if [ -f "$CUSTOM_LINKS_FILE" ]; then
    echo "Processing custom links from $CUSTOM_LINKS_FILE"
    # Extract and append all links except the last one (to handle comma correctly)
    jq -r '.links[] | tojson' "$CUSTOM_LINKS_FILE" | while read -r link; do
        if [ "$first_entry" = true ]; then
            first_entry=false
        else
            echo -n "," >> "$OUTPUT_FILE"
        fi
        echo -n $'\n  ' >> "$OUTPUT_FILE"
        echo -n "$link" >> "$OUTPUT_FILE"
    done
    
    # Get the last used id from custom links
    last_id=$(jq '.links | map(.id) | max' "$CUSTOM_LINKS_FILE")
    echo "Last ID from custom links: $last_id"
    id=$((last_id + 1))
    echo "Next ID for NPM links will be: $id"
    
    # Add comma after custom links if any were added
    if [ "$(jq '.links | length' "$CUSTOM_LINKS_FILE")" -gt 0 ]; then
        echo -n "," >> "$OUTPUT_FILE"
    fi
fi

# Process each nginx config file
for conf_file in "$TEMP_DIR"/*.conf; do
    echo "Processing file: $conf_file"
    
    # Extract server_name
    server_name=$(grep -m 1 "server_name" "$conf_file" | awk '{print $2}' | sed 's/;$//')
    if [ -z "$server_name" ]; then
        continue
    fi
    
    # Initialize/reset variables for each file
    title=""
    icon=""
    is_secret="false"
    skip="false"
    category=""
    
    # Extract metadata from comments
    metadata=$(grep -m 1 "^[[:space:]]*# {" "$conf_file" || echo "")
    echo "Found metadata: $metadata"
    echo "Found server_name: $server_name"
    
    # Parse metadata JSON
    if [ -n "$metadata" ]; then
        # Remove comment marker and leading/trailing whitespace
        metadata=$(echo "$metadata" | sed 's/^[[:space:]]*#[[:space:]]*{//' | sed 's/}[[:space:]]*$//')
        
        # Split metadata into key-value pairs
        IFS=',' read -ra pairs <<< "$metadata"
        
        # Process each key-value pair
        for pair in "${pairs[@]}"; do
            # Remove leading/trailing whitespace
            pair=$(echo "$pair" | sed 's/^[[:space:]]*//' | sed 's/[[:space:]]*$//')
            
            key=$(echo "$pair" | cut -d: -f1)
            value=$(echo "$pair" | cut -d: -f2- | sed 's/^[[:space:]]*//' | sed 's/[[:space:]]*$//' | sed 's/^"//' | sed 's/"$//')
            
            case "$key" in
                "title") title="$value" ;;
                "icon") icon="$value" ;;
                "isSecret") is_secret="$value" ;;
                "skip") skip="$value" ;;
                "category") category="$value" ;;
            esac
        done
    fi
    
    # If no title in metadata, generate from server_name
    if [ -z "$title" ]; then
        title=$(generate_title "$server_name")
    fi
    
    # Skip if skip is true
    if [ "$skip" = "true" ]; then
        continue
    fi
    
    # Construct the URL
    url="https://$server_name"
    
    # Write entry to JSON file
    if [ "$first_entry" = true ]; then
        first_entry=false
    else
        echo -n "," >> "$OUTPUT_FILE"
    fi
    echo -n $'\n  ' >> "$OUTPUT_FILE"
    echo -n "{\"id\":$id" >> "$OUTPUT_FILE"
    echo -n ",\"title\":\"$title\"" >> "$OUTPUT_FILE"
    echo -n ",\"url\":\"$url\"" >> "$OUTPUT_FILE"
    [ -n "$icon" ] && echo -n ",\"icon\":\"$icon\"" >> "$OUTPUT_FILE"
    [ "$is_secret" = "true" ] && echo -n ",\"isSecret\":true" >> "$OUTPUT_FILE"
    [ -n "$category" ] && echo -n ",\"category\":\"$category\"" >> "$OUTPUT_FILE"
    echo -n "}" >> "$OUTPUT_FILE"
    
    ((id++))
done

# Close JSON array and object
echo -e "\n]}" >> "$OUTPUT_FILE"

echo "URLs have been extracted and saved to $OUTPUT_FILE"

# Clean up
rm "$TEMP_FILE"
