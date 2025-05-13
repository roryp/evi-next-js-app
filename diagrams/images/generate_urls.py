import os
import base64
import zlib

def encode_for_plantuml(puml_code):
    """
    Encodes PlantUML text for use with the PlantUML server
    """
    compressed = zlib.compress(puml_code.encode('utf-8'))
    return base64.b64encode(compressed).decode('utf-8')

def generate_plantuml_urls(diagrams_dir):
    """
    Processes PlantUML files in the given directory and generates URLs for the PlantUML server
    """
    base_url = "https://www.plantuml.com/plantuml/png/"
    
    # Process each clean PUML file
    for filename in os.listdir(diagrams_dir):
        if filename.endswith("_clean.puml"):
            with open(os.path.join(diagrams_dir, filename), 'r') as file:
                puml_content = file.read()
                
            # Encode the PlantUML content
            encoded = encode_for_plantuml(puml_content)
            
            # Generate the URL
            url = base_url + encoded
            
            # Output name without the _clean suffix
            output_name = filename.replace("_clean.puml", ".png")
            
            print(f"{output_name}: {url}")
            
            # Create an HTML file with the image embedded
            html_content = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <title>{output_name}</title>
                <style>
                    body {{ font-family: Arial, sans-serif; margin: 20px; }}
                    h1 {{ color: #333; }}
                    img {{ max-width: 100%; border: 1px solid #ddd; }}
                    .download-link {{ margin-top: 10px; }}
                </style>
            </head>
            <body>
                <h1>{output_name}</h1>
                <img src="{url}" alt="{output_name}" />
                <div class="download-link">
                    <p>Direct URL: <a href="{url}" target="_blank">{url}</a></p>
                    <p>Right-click on the image and select "Save image as..." to download it.</p>
                </div>
            </body>
            </html>
            """
            
            # Write the HTML file
            html_file = os.path.join(diagrams_dir, output_name.replace(".png", ".html"))
            with open(html_file, 'w') as f:
                f.write(html_content)
            
            print(f"Created HTML file: {html_file}")

if __name__ == "__main__":
    # Path to the diagrams directory
    diagrams_dir = r"c:\Users\ropreddy\dev\evi-next-js-app\diagrams\images"
    generate_plantuml_urls(diagrams_dir)
