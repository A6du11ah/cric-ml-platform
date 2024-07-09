import sys
import json
import os

def analyze_video(video_path, title, description, ispublic, creation_date, video_length, video_size, video_format, user_id, video_file_ref, analytic_json):
    # Perform your video analysis here
    # For now, we'll just create a simple JSON result
    video_name = video_path

        # Ensure the 'files' directory exists
    files_dir = 'files'
    if not os.path.exists(files_dir):
        os.makedirs(files_dir)
    
    # Save the result to a file
    result_file = os.path.join(files_dir, f"{video_name}.json")

    json_path = os.path.join(analytic_json, f"{video_name}.json")


    result = {
        "message": f"{video_name} is processed successfully",
        "title": title,
        "description": description,
        "ispublic": ispublic,
        "creation_date": creation_date,
        "video_length": video_length,
        "video_size": video_size,
        "video_format": video_format,
        "user_id": user_id,
        "video_file_ref": video_file_ref,
        "analytic_json": result_file,
    } 

    with open(result_file, 'w') as f:
        json.dump(result, f)
    
    return result

if __name__ == "__main__":
    video_path = sys.argv[1]
    title = sys.argv[2]
    description = sys.argv[3]
    ispublic = sys.argv[4]
    creation_date = sys.argv[5]
    video_length = sys.argv[6]
    video_size = sys.argv[7]
    video_format = sys.argv[8]
    user_id = sys.argv[9]
    video_file_ref = sys.argv[10]
    analytic_json = sys.argv[11]
    result = analyze_video(video_path, title, description, ispublic, creation_date, video_length, video_size, video_format, user_id, video_file_ref, analytic_json)
    print(json.dumps(result))
