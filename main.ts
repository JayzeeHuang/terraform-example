import { Construct } from "constructs";
import { App, TerraformOutput, TerraformStack } from "cdktf";
import { AwsProvider } from "@cdktf/provider-aws/lib/provider";
import { KeyPair } from "@cdktf/provider-aws/lib/key-pair";
import * as fs from "fs";
import { Instance } from "@cdktf/provider-aws/lib/instance";
import { Vpc } from "@cdktf/provider-aws/lib/vpc";
import { Subnet } from "@cdktf/provider-aws/lib/subnet";
import { SecurityGroup } from "@cdktf/provider-aws/lib/security-group";

class MyStack extends TerraformStack {
  constructor(scope: Construct, id: string) {
    super(scope, id);
    const keyPath = '/Users/jayzee/.ssh/id_rsa.pub';
    const publicKey = fs.readFileSync(keyPath, 'utf-8');

    // Define AWS provider
    new AwsProvider(this, "AWS", {
      region: "ap-southeast-2"
    });

    const keyPair = new KeyPair(this, "keypair", {
      publicKey,
      keyName: "CDKTF-KEY"
    });

    const vpc = new Vpc(this, "vpc", {
      cidrBlock: '10.0.0.0/16',
      enableDnsHostnames: true,
      enableDnsSupport: true
    });

    const publicSubnet = new Subnet(this, 'public-subnet', {
      cidrBlock: '10.0.1.0/24',
      vpcId: vpc.id,
      mapPublicIpOnLaunch: true,
    });

    // const privateSubnet = new Subnet(this, 'private-subnet', {
    //   cidrBlock: '10.0.2.0/24',
    //   vpcId: vpc.id,
    //   mapPublicIpOnLaunch: false,
    // });

    // Define the security groups
    const webSecurityGroup = new SecurityGroup(this, 'web-sg', {
      vpcId: vpc.id,
      ingress: [
        {
          cidrBlocks: ['0.0.0.0/0'],
          fromPort: 80,
          toPort: 80,
          protocol: 'tcp',
        },
      ],
    });

    // const dbSecurityGroup = new SecurityGroup(this, 'db-sg', {
    //   vpcId: vpc.id,
    //   ingress: [
    //     {
    //       securityGroups: [webSecurityGroup.id],
    //       fromPort: 3306,
    //       toPort: 3306,
    //       protocol: 'tcp',
    //     },
    //   ],
    // });

    // Define the EC2 instances
    const webInstance = new Instance(this, 'web-instance', {
      ami: 'ami-08f0bc76ca5236b20',
      instanceType: 't2.micro',
      keyName: keyPair.keyName,
      subnetId: publicSubnet.id,
      vpcSecurityGroupIds: [webSecurityGroup.id],
      associatePublicIpAddress: true,
      // userData: `
      //   #!/bin/bash
      //   echo "Hello, world!" > index.html
      //   nohup python -m SimpleHTTPServer 80 &
      // `,
      // provisioners: [
      //   {
      //     type: 'local-exec',
      //     command: 'docker run -d --name my-container -p 80:80 nginx',
      //   }
      // ],
    });


    // new DbInstance(this, 'db-instance', {
    //   allocatedStorage: 20,
    //   instanceClass: "db.t2.micro",
    //   engine: "mysql",
    //   engineVersion: "8.0",
    //   identifier: "rds-instance",
    //   dbName: "rds-instance",
    //   username: "admin",
    //   password: "mypassword",
    //   skipFinalSnapshot: true,
    //   vpcSecurityGroupIds: [dbSecurityGroup.id],
    // });

    new TerraformOutput(this, id = "public_ip", {
      value: webInstance.publicIp
    });

  }
}

const app = new App();
new MyStack(app, "terraform-example");
app.synth();
