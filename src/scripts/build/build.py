import subprocess
import argparse



def run_command(command_str,**kwargs):
  result = subprocess.run(command_str, universal_newlines=True,stdout=subprocess.PIPE, stderr=subprocess.STDOUT, shell=True, **kwargs)
  if result.returncode != 0:
    print(result.stdout)

def main():
  parser = argparse.ArgumentParser()
  parser.add_argument('-d', '--dir',required=True, dest='dir')
  args = parser.parse_args()
  print(f"dir is {args.dir}")


  build_directory=args.dir + '/build'
  #run_command(f"rm -rf {build_directory}/*")
  run_command("tsc --traceResolution", cwd=args.dir)
  
 

if __name__ == "__main__":
  main()