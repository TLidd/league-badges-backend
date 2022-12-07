from roleidentification import pull_data, get_roles
import sys

def main():
    champion_roles = pull_data()

    
    team = []
    for champID in sys.argv[1:]:
        team.append(int(champID))

    roles = get_roles(champion_roles, team)
    values = roles.values()

    role_ordering = ""

    for value in values:
        role_ordering += str(value) + " " 

    print(role_ordering, flush=True) 



if __name__ == "__main__":
    main()