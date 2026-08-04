import sys

def main():
    if len(sys.argv) < 2: return
    filepath = sys.argv[1]
    with open(filepath, 'r') as f:
        lines = f.readlines()
    
    with open(filepath, 'w') as f:
        for line in lines:
            if line.startswith('pick 823107a'):
                f.write('edit 823107a' + line[12:])
            else:
                f.write(line)

if __name__ == '__main__':
    main()
