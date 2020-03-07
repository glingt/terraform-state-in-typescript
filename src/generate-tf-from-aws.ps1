$arr = @()

$arr += "asg"       # AutoScaling Group
$arr += "dbpg"      # Database Parameter Group
$arr += "dbsg"      # Database Security Group
$arr += "dbsn"      # Database Subnet Group
$arr += "ec2"       # EC2
$arr += "ecc"       # ElastiCache Cluster
$arr += "ecsn"      # ElastiCache Subnet Group
$arr += "elb"       # ELB
$arr += "iamg"      # IAM Group
$arr += "iamgm"     # IAM Group Membership
$arr += "iamgp"     # IAM Group Policy
$arr += "iamip"     # IAM Instance Profile
$arr += "iamp"      # IAM Policy
$arr += "iamr"      # IAM Role
$arr += "iamrp"     # IAM Role Policy
$arr += "iamu"      # IAM User
$arr += "iamup"     # IAM User Policy
$arr += "nacl"      # Network ACL
$arr += "r53r"      # Route53 Record
$arr += "r53z"      # Route53 Hosted Zone
$arr += "rds"       # RDS
$arr += "rt"        # Route Table
$arr += "rta"       # Route Table Association
$arr += "s3"        # S3
$arr += "sg"        # Security Group
$arr += "sn"        # Subnet
$arr += "vpc"       # VPC

iex "echo '' > global.tfstate"

Foreach ($d in $arr)
{
  # iex "terraforming $d | out-file -encoding ASCII $d.tf"
  iex "terraforming $d --tfstate --merge global.tfstate"
}