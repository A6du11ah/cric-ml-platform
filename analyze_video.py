import sys
import json
import os

def analyze_video(video_name, analytic_json_saving_path):
    
    files_dir = 'files'
    if not os.path.exists(files_dir):
        os.makedirs(files_dir)
    
    # Save the result to a file
    result_file = os.path.join(files_dir, f"{video_name}.json")

    json_path = os.path.join(analytic_json_saving_path, f"{video_name}.json")


    result = {
        "message": f"{video_name} is processed successfully",
    } 

    with open(result_file, 'w') as f:
        json.dump(result, f)
    
    return result

if __name__ == "__main__":
    video_path = sys.argv[1]
    json_saving_path = sys.argv[2]
    result = analyze_video(video_path, json_saving_path)
    print(json.dumps(result))
