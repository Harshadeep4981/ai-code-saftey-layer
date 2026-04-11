#WE HAVE BUILD A RECURSIVE SCANNER WHICH CONTINOUSLY FETCHES THROUGH THE FOLDERS TILL WE GET A PROPER FILE REQUIRED
#we will build a scanner in such a way that it handles all the errors and we make a fault-tolerant system

import requests                                      #this helps us to connect to the github
import time                                          #this helps in giving a time delay so that the requests do not approach github instantly
token = "TOKEN_HERE"
user ={
    "Autherization" : f"token {token}"
}
count = 0
MAX_FILES = 20
def get_contents(owner,repo,path=""):
    global count
    url = f"https://api.github.com/repos/{owner}/{repo}/contents/{path}" #this is the api endpoint (API (what you want to access))
    try :                                                     #we use this for few more error handlings
        response = requests.get(url,headers=user,timeout = 10)#here we call the github api and we use 'rest-api' here(http how you want to acs)
        if response.status_code != 200:                       #this here handles the status code errors like 401,403 etc
            return
        data = response.json()                                #here this converts the python text file to json type
        for item in data:
            if count >= MAX_FILES:
                return
            if item["type"]=="file" :
                if item["name"].endswith((".py",".js",".java",".cpp")):
                    count += 1
                    file_url = item["download_url"]
                    try:
                        file_response = requests.get(file_url,headers=user)
                        if file_response.status_code == 200:
                            file_data = file_response.text
                            lines = file_data.splitlines()
                            for i,line in enumerate(lines,start=1):
                                if len(line)>120:
                                    print(f"The line{i} has {len(line)} has too many characters so it is too long")
                            import_count = 0
                            for line in lines:
                                if line.split().startswith("import") or line.split().startswith("from"):
                                    import_count+=1
                            if import_count > 3:
                                print(f"\nFILE:{item['path']}")
                                print(f"\n too many imports{import_count}")
                            for i in range(len(lines)-1):
                                line1 = lines[i].strip()
                                line2 = lines[i+1].strip()
                                if line1.startswith("for") and line2.startswith("for"):
                                    print(f"\nFILE: {item:'path'}")
                                    print(f"Line {i+1} NESTED LOOP DETECTED")
                    except:
                        pass
            elif item["type"]=="dir":                                          #in this we go int0 the folders and this is recurssive scanning
                time.sleep(0.2)                                                #this is for one more error handling
                get_contents(owner,repo,item["path"])                          #this repeatedly calls the function plays the role of reccursion
    except:
        return
get_contents("python","cpython")